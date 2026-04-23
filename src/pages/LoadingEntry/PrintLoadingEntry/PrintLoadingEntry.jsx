import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../utils/apiClient/apiClient";
import logo from "../../../assets/Hans.png";
import signature from "../../../assets/signature.png";
import stamp from "../../../assets/stamp.png";

const PrintLoadingEntry = async (data) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d)
      ? "N/A"
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const formatCurrency = (val) =>
    `Rs. ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

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

  let seller = {};
  let order = {};
  let transporter = {};
  let consignee = {};

  try {
    const promises = [];
    if (data.supplier && typeof data.supplier === "string") {
      promises.push(
        api
          .get(`/sellers/${data.supplier}`)
          .then((res) => (seller = res.data))
          .catch(() => {}),
      );
    } else if (data.supplier && typeof data.supplier === "object") {
      seller = data.supplier;
    }

    if (data.saudaNo) {
      promises.push(
        api
          .get(`/self-order/sauda/${data.saudaNo}`)
          .then((res) => (order = res.data))
          .catch(() => {}),
      );
    }

    if (data.transporterId) {
      promises.push(
        api
          .get(`/transporters/${data.transporterId}`)
          .then((res) => (transporter = res.data))
          .catch(() => {}),
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("Error fetching related data for PDF:", error);
  }

  const [logo64, sign64, stamp64] = await Promise.all([
    getBase64(logo),
    getBase64(signature),
    getBase64(stamp),
  ]);

  // Fallback logic for all fields
  const sellerCompanyName = (
    data.supplierCompany ||
    seller.companyName ||
    "N/A"
  ).toUpperCase();
  const sellerName = data.sellerName || seller.sellerName || "N/A";
  const sellerPhone =
    data.sellerPhone ||
    seller.mobileNo ||
    (seller.phoneNumbers && seller.phoneNumbers[0]?.value) ||
    "N/A";
  const sellerEmail =
    data.sellerEmail ||
    seller.email ||
    (seller.emails && seller.emails[0]?.value) ||
    "N/A";
  const sellerGstin =
    data.sellerGstin || seller.gstNumber || seller.gstin || "NOT AVAILABLE";
  const sellerAddress =
    data.sellerAddress ||
    seller.address ||
    (seller.city && seller.state ? `${seller.city}, ${seller.state}` : "N/A");

  const buyerCompanyName = (
    data.buyerCompany ||
    order.buyerCompany ||
    order.buyer ||
    "N/A"
  ).toUpperCase();
  const consigneeName = data.consignee || order.consignee || "N/A";
  const consigneeGst = data.consigneeGst || "NOT AVAILABLE";
  const buyerMobile = data.buyerMobile || order.buyerMobile || "N/A";

  const deliveryAddress =
    data.deliveryAddress ||
    (order.location && order.state
      ? `${order.location}, ${order.state}`
      : "Address details not found.");

  // Page setup
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Simple Header - Elegant thin lines
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.line(margin, 10, pageWidth - margin, 10);
  doc.line(margin, 48, pageWidth - margin, 48);

  if (logo64) {
    doc.addImage(logo64, "PNG", margin + 2, 14, 24, 24);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(sellerCompanyName, 47, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Seller: ${sellerName}`, 47, 28);
  doc.setFontSize(8);
  doc.text(`Email: ${sellerEmail}`, 47, 33);
  doc.text(`Contact: ${sellerPhone} | GSTIN: ${sellerGstin}`, 47, 37);
  doc.text(`Address: ${sellerAddress}`, 47, 41);

  // Title Section - Right Aligned
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LORRY CHALLAN", pageWidth - margin - 5, 22, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `DATE: ${formatDate(data.loadingDate)}`,
    pageWidth - margin - 5,
    34,
    {
      align: "right",
    },
  );
  doc.text(
    `CHALLAN NO: ${data.billNumber || "N/A"}`,
    pageWidth - margin - 5,
    39,
    {
      align: "right",
    },
  );

  const addTable = (title, y, head, body) => {
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title.toUpperCase(), margin, y - 2);

    autoTable(doc, {
      startY: y,
      head: [head],
      body: [body],
      theme: "grid",
      headStyles: {
        fillColor: [250, 250, 250],
        textColor: [0, 0, 0],
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        halign: "center",
        lineWidth: 0.1,
        lineColor: [230, 230, 230],
      },
      columnStyles: {
        0: { halign: "left" },
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 3,
        overflow: "linebreak",
      },
    });

    return doc.lastAutoTable.finalY + 12;
  };

  let currentY = 58;

  currentY = addTable(
    "Parties Information",
    currentY,
    ["Seller Company", "Buyer Company", "Consignee Name", "Sauda No"],
    [sellerCompanyName, buyerCompanyName, consigneeName, data.saudaNo || "N/A"],
  );

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.1);
  const splitDeliveryAddress = doc.splitTextToSize(
    deliveryAddress,
    pageWidth - margin * 2 - 10,
  );
  const deliveryHeight = Math.max(16, splitDeliveryAddress.length * 5 + 8);

  doc.rect(margin, currentY - 5, pageWidth - margin * 2, deliveryHeight, "S");
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DELIVERY ADDRESS", margin + 4, currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(splitDeliveryAddress, margin + 4, currentY + 5);
  currentY += deliveryHeight + 6;

  currentY = addTable(
    "Goods & Weight Details",
    currentY,
    ["Commodity", "Bags", "Loading Weight", "Unloading Weight", "Vehicle No"],
    [
      data.commodity || "N/A",
      data.bags || "0",
      `${data.loadingWeight || 0} Tons`,
      `${data.unloadingWeight || 0} Tons`,
      (data.lorryNumber || "N/A").toUpperCase(),
    ],
  );

  currentY = addTable(
    "Transporter Information",
    currentY,
    ["Transporter Name", "Driver Name", "Driver Contact", "Lorry No"],
    [
      data.addedTransport || transporter.name || "N/A",
      data.driverName || "N/A",
      data.driverPhoneNumber || "N/A",
      (data.lorryNumber || "N/A").toUpperCase(),
    ],
  );

  const totalF = Number(data.totalFreight || 0);
  const adv = Number(data.advance || 0);
  const bal = totalF - adv;

  currentY = addTable(
    "Freight & Payment Summary",
    currentY,
    ["Freight Rate", "Total Freight", "Advance Paid", "Balance Payable"],
    [
      formatCurrency(data.freightRate),
      formatCurrency(totalF),
      formatCurrency(adv),
      formatCurrency(bal),
    ],
  );

  // Signatures Section
  const signY = pageHeight - 40;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.line(margin, signY + 10, margin + 50, signY + 10);
  doc.line(pageWidth - margin - 50, signY + 10, pageWidth - margin, signY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("DRIVER'S SIGNATURE", margin + 25, signY + 14, { align: "center" });
  doc.text("AUTHORIZED SIGNATORY", pageWidth - margin - 25, signY + 14, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`FOR ${sellerCompanyName}`, pageWidth - margin - 25, signY + 5, {
    align: "center",
  });

  if (sign64) {
    doc.addImage(sign64, "PNG", pageWidth - margin - 40, signY - 8, 30, 10);
  }
  if (stamp64) {
    doc.setGState(new doc.GState({ opacity: 0.4 }));
    doc.addImage(stamp64, "PNG", pageWidth - margin - 45, signY - 20, 25, 25);
    doc.setGState(new doc.GState({ opacity: 1.0 }));
  }

  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "This is a system-generated Lorry Challan issued via the Hansaria Food platform. No physical signature is required. Hansaria Food Private Limited shall not be held liable for any discrepancies or inaccuracies in the loading data provided by users.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;
