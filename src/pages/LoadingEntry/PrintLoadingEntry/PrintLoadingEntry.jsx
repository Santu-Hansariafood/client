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

  const primary = [21, 128, 61];
  const secondary = [234, 179, 8];
  const dark = [15, 23, 42];
  const light = [254, 252, 232];
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
    `Rs. ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

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

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  doc.setFillColor(...secondary);
  doc.rect(0, 0, 2.5, pageHeight, "F");

  // --- Header ---
  // Top Banner - Green
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Logo Area
  if (logo64) {
    // White background for logo with slight shadow/border effect
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 8, 26, 26, 3, 3, "F");
    doc.addImage(logo64, "PNG", 14, 10, 22, 22);
  }

  // Company Details
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HANSARIA FOOD PVT. LTD.", 44, 18);

  // Subtle separator line in header
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(44, 20, 120, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Broker & Commission Agent | Premium Quality Food Products", 44, 25);
  
  doc.setFontSize(8);
  doc.setTextColor(240, 240, 240);
  doc.text("Email: info@hansariafood.com | Web: www.hansariafood.com", 44, 30);
  doc.text("Contact: +91-XXXXXXXXXX | GSTIN: XXXXXXXXXXXXXXXXX", 44, 34);

  // Document Title Box - Yellow
  doc.setFillColor(...secondary);
  doc.rect(pageWidth - 65, 12, 65, 12, "F");
  doc.setTextColor(...dark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LORRY CHALLAN", pageWidth - 32.5, 20, { align: "center" });

  // Date & Number Area
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DATE: ${formatDate(data.loadingDate)}`, pageWidth - 14, 31, { align: "right" });
  doc.text(`CHALLAN NO: ${data.billNumber || "N/A"}`, pageWidth - 14, 36, { align: "right" });

  // --- Data Fetching & Matching ---

  const [orders, sellers, companies, consignees] = await Promise.all([
    safeFetch("/self-order"),
    safeFetch("/sellers"),
    safeFetch("/seller-company"),
    safeFetch("/consignees"),
  ]);

  const supplierId = typeof data.supplier === "object" ? data.supplier?._id : data.supplier;
  const buyer = orders.find((o) => String(o.saudaNo) === String(data.saudaNo)) || {};
  const seller = sellers.find((s) => String(s._id) === String(supplierId)) || {};
  const company = companies.find((c) => normalize(c.companyName) === normalize(data.supplierCompany)) || {};
  
  // Robust Consignee Matching from API
  const consignee = consignees.find((c) => 
    String(c._id) === String(data.consignee) || 
    normalize(c.name) === normalize(data.consignee) ||
    normalize(c.label) === normalize(data.consignee)
  ) || {};

  const fullAddress = [
    consignee.location,
    consignee.district,
    consignee.state,
    consignee.pin,
  ]
    .filter(Boolean)
    .join(", ");

  const addTable = (title, y, head, body, colors = primary) => {
    doc.setFillColor(...secondary);
    doc.rect(margin, y - 5, 4, 6, "F");
    
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin + 6, y);
    
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.1);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);

    autoTable(doc, {
      startY: y + 4,
      head: [head],
      body: [body],
      theme: "striped",
      headStyles: {
        fillColor: colors,
        textColor: 255,
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
        halign: "center",
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { halign: "left" },
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 4,
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: light,
      },
    });

    return doc.lastAutoTable.finalY + 12;
  };

  let currentY = 55;

  currentY = addTable(
    "Parties Information",
    currentY,
    ["Seller Name", "Seller Company", "Buyer Name", "Consignee Name"],
    [
      seller.sellerName || "N/A",
      data.supplierCompany || "N/A",
      buyer.buyer || "N/A",
      consignee.name || data.consignee || "N/A",
    ],
    primary
  );

  doc.setFillColor(...light);
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY - 5, pageWidth - (margin * 2), 22, 2, 2, "FD");

  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DELIVERY ADDRESS", margin + 5, currentY + 2);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...dark);
  const addressText = fullAddress || "Consignee address details not found in database. Please check Consignee API.";
  const splitAddress = doc.splitTextToSize(addressText, pageWidth - (margin * 2) - 10);
  doc.text(splitAddress, margin + 5, currentY + 8);
  currentY += 25;

  currentY = addTable(
    "Transport & Goods Details",
    currentY,
    ["Commodity", "Bags", "Weight", "Vehicle Number"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${data.loadingWeight || 0} Tons`,
      (data.lorryNumber || "N/A").toUpperCase(),
    ]
  );

  const total = Number(data.totalFreight || 0);
  const advance = Number(data.advance || 0);
  const balance = total - advance;

  currentY = addTable(
    "Freight & Payment Summary",
    currentY,
    ["Freight Rate", "Total Freight", "Advance Paid", "Balance Payable"],
    [
      formatCurrency(data.freightRate),
      formatCurrency(total),
      formatCurrency(advance),
      formatCurrency(balance),
    ],
    primary
  );

  // --- Footer Section ---
  const footerY = pageHeight - 75;
  
  // QR Code Area
  try {
    const qrText = `https://www.hansariafood.com`;
    const qr = await QRCode.toDataURL(qrText);
    const qrSize = 30;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Design around QR
    doc.setDrawColor(...secondary);
    doc.setLineWidth(0.5);
    doc.roundedRect(qrX - 2, footerY - 2, qrSize + 4, qrSize + 10, 2, 2, "D");
    
    doc.addImage(qr, "PNG", qrX, footerY, qrSize, qrSize);
    doc.setFontSize(7.5);
    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN TO VISIT WEBSITE", pageWidth / 2, footerY + qrSize + 5, { align: "center" });
  } catch {}

  // Signature Blocks
  const signBaseY = pageHeight - 38;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  
  // Driver Side
  doc.text("DRIVER'S SIGNATURE", margin + 5, signBaseY);
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(margin, signBaseY + 10, margin + 55, signBaseY + 10);

  // Authorized Side
  doc.setTextColor(...primary);
  doc.text("FOR HANSARIA FOOD PVT. LTD.", pageWidth - margin - 60, signBaseY, { align: "center" });
  
  if (sign64) {
    doc.addImage(sign64, "PNG", pageWidth - margin - 50, signBaseY + 2, 35, 12);
  }
  if (stamp64) {
    doc.setGState(new doc.GState({ opacity: 0.6 }));
    doc.addImage(stamp64, "PNG", pageWidth - margin - 65, signBaseY - 15, 30, 30);
    doc.setGState(new doc.GState({ opacity: 1.0 }));
  }
  
  doc.setDrawColor(...primary);
  doc.line(pageWidth - margin - 65, signBaseY + 15, pageWidth - margin, signBaseY + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("Authorized Signatory", pageWidth - margin - 32.5, signBaseY + 20, { align: "center" });

  // Bottom Strip
  doc.setFillColor(...primary);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");
  
  doc.setFillColor(...secondary);
  doc.rect(0, pageHeight - 8.5, pageWidth, 0.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Terms & Conditions: This is an electronic challan. Goods received in good condition.", pageWidth / 2, pageHeight - 3, { align: "center" });

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;
