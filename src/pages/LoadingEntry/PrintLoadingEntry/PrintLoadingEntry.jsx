import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import logo from "../../../assets/Hans.png";
import signature from "../../../assets/signature.png";
import stamp from "../../../assets/stamp.png";
import QRCode from "qrcode";

const PrintLoadingEntry = async (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const primary = [22, 163, 74];
  const light = [240, 253, 244];
  const darkText = [31, 41, 55];

  const safeFetch = async (url) => {
    try {
      const res = await axios.get(url);
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    } catch (e) {
      console.error(`Error fetching ${url}`, e);
      return [];
    }
  };

  const normalize = (str) => (str || "").toString().trim().toLowerCase();

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "N/A"
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const formatCurrency = (val) =>
    `Rs. ${Number(val || 0).toLocaleString("en-IN")}`;

  const getBase64Image = (img) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.src = img;
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
  };

  const [logoBase64, signBase64, stampBase64] = await Promise.all([
    getBase64Image(logo),
    getBase64Image(signature),
    getBase64Image(stamp),
  ]);

  doc.setFillColor(...light);
  doc.rect(0, 0, pageWidth, 40, "F");

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 14, 10, 28, 18);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primary);
  doc.text("HANSARIA FOOD PVT. LTD.", 50, 18);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Broker & Commission Agent", 50, 24);

  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text("LORRY CHALLAN", pageWidth - 15, 18, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Date: ${formatDate(data.loadingDate)}`, pageWidth - 15, 24, {
    align: "right",
  });

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.line(15, 42, pageWidth - 15, 42);

  const [ordersData, sellersData, companiesData, consigneesData] =
    await Promise.all([
      safeFetch("/self-order"),
      safeFetch("/sellers"),
      safeFetch("/seller-company"),
      safeFetch("/consignees"),
    ]);

  const supplierId =
    typeof data.supplier === "object" ? data.supplier?._id : data.supplier;

  const buyerDetails =
    ordersData.find((o) => o.saudaNo === data.saudaNo) || {};

  const sellerDetails =
    sellersData.find((s) => String(s._id) === String(supplierId)) || {};

  const companyDetails =
    companiesData.find(
      (c) =>
        normalize(c.companyName) === normalize(data.supplierCompany),
    ) || {};

  const consigneeDetails =
    consigneesData.find(
      (c) => normalize(c.name) === normalize(data.consignee),
    ) || {};

  const addTable = (title, y, headers, body) => {
    doc.setFontSize(10);
    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.text(title, 15, y);

    autoTable(doc, {
      startY: y + 4,
      head: [headers],
      body: [body],
      theme: "grid",
      headStyles: {
        fillColor: primary,
        textColor: 255,
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkText,
      },
      styles: { cellPadding: 3 },
      margin: { left: 15, right: 15 },
    });

    return doc.lastAutoTable.finalY + 8;
  };

  let y = 50;

  y = addTable("Seller Details", y,
    ["Seller", "GST", "Challan No", "PO No"],
    [
      sellerDetails.sellerName || "N/A",
      companyDetails.gstNo || "N/A",
      data.billNumber || "N/A",
      data.saudaNo || "N/A",
    ]
  );

  y = addTable("Buyer & Delivery", y,
    ["Buyer", "Consignee", "Address"],
    [
      buyerDetails.buyer || "N/A",
      data.consignee || "N/A",
      consigneeDetails.location || "N/A",
    ]
  );

  y = addTable("Transport Details", y,
    ["Product", "Bags", "Weight", "Lorry No"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${Number(data.loadingWeight || 0)} Tons`,
      (data.lorryNumber || "").toUpperCase(),
    ]
  );

  const totalFreight = Number(data.totalFreight) || 0;
  const advance = Number(data.advance) || 0;

  y = addTable("Freight Summary", y,
    ["Rate", "Total", "Advance", "Balance"],
    [
      formatCurrency(data.freightRate),
      formatCurrency(totalFreight),
      formatCurrency(advance),
      formatCurrency(totalFreight - advance),
    ]
  );

  const qrData = `Challan: ${data.billNumber}\nLorry: ${data.lorryNumber}\nAmount: ${totalFreight}`;
  const qrImage = await QRCode.toDataURL(qrData);

  doc.addImage(qrImage, "PNG", pageWidth - 45, pageHeight - 60, 30, 30);
  doc.setFontSize(7);
  doc.text("Scan for details", pageWidth - 30, pageHeight - 25, { align: "center" });

  let signY = pageHeight - 50;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Driver Signature", 20, signY);
  doc.line(20, signY + 12, 70, signY + 12);

  doc.text("Authorized Signatory", pageWidth - 20, signY, { align: "right" });

  if (signBase64) {
    doc.addImage(signBase64, "PNG", pageWidth - 70, signY - 10, 40, 15);
  }

  if (stampBase64) {
    doc.addImage(stampBase64, "PNG", pageWidth - 90, signY - 5, 35, 35);
  }

  doc.line(pageWidth - 70, signY + 12, pageWidth - 20, signY + 12);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "This is a system generated document.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;