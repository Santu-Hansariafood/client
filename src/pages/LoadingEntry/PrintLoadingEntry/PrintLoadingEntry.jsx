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

  const primary = [15, 23, 42];
  const teal = [13, 148, 136];
  const accent = [99, 102, 241];
  const light = [248, 250, 252];
  const gray = [100, 116, 139];

  const normalize = (str) => (str || "").toString().trim().toLowerCase();

  const formatDate = (date) => {
    const d = new Date(date);
    return isNaN(d) ? "N/A" : d.toLocaleDateString("en-IN");
  };

  const formatCurrency = (val) =>
    `₹ ${Number(val || 0).toLocaleString("en-IN")}`;

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
        canvas.getContext("2d").drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      image.onerror = () => resolve(null);
    });

  const [logo64, sign64, stamp64] = await Promise.all([
    getBase64(logo),
    getBase64(signature),
    getBase64(stamp),
  ]);

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setFillColor(...teal);
  doc.rect(0, 32, pageWidth, 6, "F");

  if (logo64) {
    doc.addImage(logo64, "PNG", 12, 6, 22, 18);
  }

  doc.setTextColor(255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("HANSARIA FOOD PVT. LTD.", 40, 16);

  doc.setFontSize(9);
  doc.setTextColor(220);
  doc.text("Broker & Commission Agent", 40, 22);

  doc.setFontSize(13);
  doc.text("LORRY CHALLAN", pageWidth - 15, 16, { align: "right" });

  doc.setFontSize(8);
  doc.text(`Date: ${formatDate(data.loadingDate)}`, pageWidth - 15, 22, {
    align: "right",
  });

  const [orders, sellers, companies, consignees] = await Promise.all([
    safeFetch("/self-order"),
    safeFetch("/sellers"),
    safeFetch("/seller-company"),
    safeFetch("/consignees"),
  ]);

  const supplierId =
    typeof data.supplier === "object" ? data.supplier?._id : data.supplier;

  const buyer = orders.find((o) => o.saudaNo === data.saudaNo) || {};

  const seller =
    sellers.find((s) => String(s._id) === String(supplierId)) || {};

  const company =
    companies.find(
      (c) => normalize(c.companyName) === normalize(data.supplierCompany),
    ) || {};

  const consignee =
    consignees.find((c) => normalize(c.name) === normalize(data.consignee)) ||
    {};

  const fullAddress = [
    consignee.location,
    consignee.district,
    consignee.state,
    consignee.pin,
  ]
    .filter(Boolean)
    .join(", ");

  const addTable = (title, y, head, body) => {
    doc.setTextColor(...teal);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [head],
      body: [body],
      theme: "grid",
      headStyles: {
        fillColor: teal,
        textColor: 255,
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: light,
      },
      margin: { left: 14, right: 14 },
    });

    return doc.lastAutoTable.finalY + 6;
  };

  let y = 45;

  y = addTable(
    "Seller Details",
    y,
    ["Seller", "GST", "Challan", "PO"],
    [
      seller.sellerName || "N/A",
      company.gstNo || "N/A",
      data.billNumber || "N/A",
      data.saudaNo || "N/A",
    ],
  );

  y = addTable(
    "Buyer & Consignee",
    y,
    ["Buyer", "Consignee", "Address"],
    [buyer.buyer || "N/A", data.consignee || "N/A", fullAddress || "N/A"],
  );

  y = addTable(
    "Transport",
    y,
    ["Product", "Bags", "Weight", "Lorry"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${data.loadingWeight || 0} Tons`,
      data.lorryNumber || "N/A",
    ],
  );

  const total = Number(data.totalFreight || 0);
  const advance = Number(data.advance || 0);

  y = addTable(
    "Freight",
    y,
    ["Rate", "Total", "Advance", "Balance"],
    [
      formatCurrency(data.freightRate),
      formatCurrency(total),
      formatCurrency(advance),
      formatCurrency(total - advance),
    ],
  );

  try {
    const qr = await QRCode.toDataURL(`Challan: ${data.billNumber}`);

    const size = 30;
    const x = (pageWidth - size) / 2;

    doc.addImage(qr, "PNG", x, y + 5, size, size);
  } catch {}

  const signY = pageHeight - 40;

  doc.setTextColor(...gray);
  doc.text("Driver Signature", 20, signY);
  doc.line(20, signY + 10, 70, signY + 10);

  doc.text("Authorized Signatory", pageWidth - 20, signY, {
    align: "right",
  });

  if (sign64) {
    doc.addImage(sign64, "PNG", pageWidth - 70, signY - 10, 35, 12);
  }

  if (stamp64) {
    doc.addImage(stamp64, "PNG", pageWidth - 90, signY - 5, 30, 30);
  }

  doc.line(pageWidth - 70, signY + 10, pageWidth - 20, signY + 10);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("System Generated Document", pageWidth / 2, pageHeight - 8, {
    align: "center",
  });

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;
