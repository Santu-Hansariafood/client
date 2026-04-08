import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import logo from "../../../assets/Hans.png";
import signature from "../../../assets/signature.png";
import stamp from "../../../assets/stamp.png";
import QRCode from "qrcode";

const PrintLoadingEntry = async (data) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  const primary = [15, 23, 42]; // Dark Navy
  const teal = [13, 148, 136]; // Teal
  const accent = [245, 158, 11]; // Amber/Gold for premium touch
  const light = [248, 250, 252];
  const gray = [71, 85, 105];
  const lightGray = [226, 232, 240];

  const normalize = (str) => (str || "").toString().trim().toLowerCase();

  const formatDate = (date) => {
    const d = new Date(date);
    return isNaN(d) ? "N/A" : d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (val) =>
    `INR ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const safeFetch = async (url) => {
    try {
      const res = await axios.get(url);
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    } catch {
      return [];
    }
  };

  const getBase64 = (img) =>
    new Promise((resolve) => {
      const image = new Image();
      image.src = img;
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      image.onerror = () => resolve(null);
    });

  const [logo64, sign64, stamp64] = await Promise.all([
    getBase64(logo),
    getBase64(signature),
    getBase64(stamp),
  ]);

  // --- Background Design ---
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Subtle Side Accent
  doc.setFillColor(...primary);
  doc.rect(0, 0, 2, pageHeight, "F");

  // --- Header ---
  // Top Banner
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 40, "F");

  if (logo64) {
    // White circular background for logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 8, 24, 24, 3, 3, "F");
    doc.addImage(logo64, "PNG", 14, 10, 20, 20);
  }

  // Company Details
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("HANSARIA FOOD PVT. LTD.", 42, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Broker & Commission Agent | Premium Quality Food Products", 42, 24);
  doc.text("Email: info@hansariafood.com | Contact: +91-XXXXXXXXXX", 42, 29);

  // Document Title
  doc.setFillColor(...accent);
  doc.rect(pageWidth - 65, 12, 65, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LORRY CHALLAN", pageWidth - 32.5, 18.5, { align: "center" });

  // Date & Number
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`DATE: ${formatDate(data.loadingDate)}`, pageWidth - 14, 28, { align: "right" });
  doc.text(`CHALLAN NO: ${data.billNumber || "N/A"}`, pageWidth - 14, 33, { align: "right" });

  // --- Data Fetching & Matching ---
  const [orders, sellers, companies, consignees] = await Promise.all([
    safeFetch("/self-order"),
    safeFetch("/sellers"),
    safeFetch("/seller-company"),
    safeFetch("/consignees"),
  ]);

  const supplierId = typeof data.supplier === "object" ? data.supplier?._id : data.supplier;
  const buyer = orders.find((o) => o.saudaNo === data.saudaNo) || {};
  const seller = sellers.find((s) => String(s._id) === String(supplierId)) || {};
  const company = companies.find((c) => normalize(c.companyName) === normalize(data.supplierCompany)) || {};
  
  // Robust Consignee Matching
  const consignee = consignees.find((c) => 
    String(c._id) === String(data.consignee) || 
    normalize(c.name) === normalize(data.consignee)
  ) || {};

  const fullAddress = [
    consignee.location,
    consignee.district,
    consignee.state,
    consignee.pin,
  ]
    .filter(Boolean)
    .join(", ");

  const addTable = (title, y, head, body, colors = teal) => {
    // Table Title with underline
    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin, y);
    
    doc.setDrawColor(...colors);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 1.5, margin + 25, y + 1.5);

    autoTable(doc, {
      startY: y + 4,
      head: [head],
      body: [body],
      theme: "striped",
      headStyles: {
        fillColor: colors,
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        halign: "center",
      },
      columnStyles: {
        0: { halign: "left" },
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 3,
      },
    });

    return doc.lastAutoTable.finalY + 10;
  };

  let currentY = 50;

  // --- Parties Section ---
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  currentY = addTable(
    "Parties Information",
    currentY,
    ["Seller Name", "Seller Company", "Buyer Name", "Consignee"],
    [
      seller.sellerName || "N/A",
      data.supplierCompany || "N/A",
      buyer.buyer || "N/A",
      data.consignee || "N/A",
    ],
    primary
  );

  // Address Section (Special Layout)
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY ADDRESS", margin, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  const splitAddress = doc.splitTextToSize(fullAddress || "Address details not available", pageWidth - (margin * 2));
  doc.text(splitAddress, margin, currentY);
  currentY += (splitAddress.length * 5) + 5;

  // --- Transport Section ---
  currentY = addTable(
    "Transport & Goods",
    currentY,
    ["Commodity", "No. of Bags", "Weight", "Lorry Number"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${data.loadingWeight || 0} Tons`,
      (data.lorryNumber || "N/A").toUpperCase(),
    ]
  );

  // --- Freight Section ---
  const total = Number(data.totalFreight || 0);
  const advance = Number(data.advance || 0);
  const balance = total - advance;

  currentY = addTable(
    "Financial Summary",
    currentY,
    ["Freight Rate", "Total Freight", "Advance Paid", "Balance Amount"],
    [
      formatCurrency(data.freightRate),
      formatCurrency(total),
      formatCurrency(advance),
      formatCurrency(balance),
    ],
    teal
  );

  // --- Footer Section ---
  const footerY = pageHeight - 65;
  
  // QR Code - Center
  try {
    const qrText = `Challan: ${data.billNumber}\nLorry: ${data.lorryNumber}\nWeight: ${data.loadingWeight}T\nBalance: ${balance}`;
    const qr = await QRCode.toDataURL(qrText);
    const qrSize = 35;
    const qrX = (pageWidth - qrSize) / 2;
    
    // QR Border
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.roundedRect(qrX - 2, footerY - 2, qrSize + 4, qrSize + 10, 2, 2, "D");
    
    doc.addImage(qr, "PNG", qrX, footerY, qrSize, qrSize);
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text("SCAN FOR VERIFICATION", pageWidth / 2, footerY + qrSize + 5, { align: "center" });
  } catch {}

  // Signatures
  const signBaseY = pageHeight - 35;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primary);
  
  // Left: Driver
  doc.text("DRIVER SIGNATURE", margin + 10, signBaseY);
  doc.setDrawColor(...lightGray);
  doc.line(margin, signBaseY + 8, margin + 50, signBaseY + 8);

  // Right: Authorized
  doc.text("FOR HANSARIA FOOD PVT. LTD.", pageWidth - margin - 50, signBaseY, { align: "center" });
  
  if (sign64) {
    doc.addImage(sign64, "PNG", pageWidth - margin - 45, signBaseY + 2, 30, 10);
  }
  if (stamp64) {
    doc.setGState(new doc.GState({ opacity: 0.7 })); // Subtle transparency for stamp
    doc.addImage(stamp64, "PNG", pageWidth - margin - 55, signBaseY - 10, 25, 25);
    doc.setGState(new doc.GState({ opacity: 1.0 }));
  }
  
  doc.line(pageWidth - margin - 50, signBaseY + 12, pageWidth - margin, signBaseY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Authorized Signatory", pageWidth - margin - 25, signBaseY + 16, { align: "center" });

  // Bottom Footer
  doc.setFillColor(...primary);
  doc.rect(0, pageHeight - 5, pageWidth, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("This is a computer generated document and does not require a physical signature.", pageWidth / 2, pageHeight - 1.5, { align: "center" });

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;
