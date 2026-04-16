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

  const primary = [17, 24, 39];
  const secondary = [14, 116, 144];
  const accent = [245, 158, 11];
  const tableBlue = [37, 99, 235];
  const tableBlueLight = [219, 234, 254];
  const dark = [15, 23, 42];
  const light = [248, 250, 252];
  const gray = [71, 85, 105];

  const normalize = (str) => (str || "").toString().trim().toLowerCase();

  const formatDate = (date) => {
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

  const pickFirst = (...values) =>
    values.find((v) => String(v || "").trim() !== "") || "";

  const safeFetch = async (url) => {
    try {
      const res = await api.get(url);
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

  const [orders, sellers, companies, consignees, transporters] =
    await Promise.all([
      safeFetch("/self-order?limit=0"),
      safeFetch("/sellers?limit=0"),
      safeFetch("/seller-company?limit=0"),
      safeFetch("/consignees?limit=0"),
      safeFetch("/transporters?limit=0"),
    ]);

  const supplierId =
    typeof data.supplier === "object" ? data.supplier?._id : data.supplier;
  const buyer =
    orders.find((o) => String(o.saudaNo) === String(data.saudaNo)) || {};
  const seller =
    sellers.find((s) => String(s._id) === String(supplierId)) || {};
  const company =
    companies.find(
      (c) => normalize(c.companyName) === normalize(data.supplierCompany),
    ) || {};

  const transporter =
    transporters.find((t) => String(t._id) === String(data.transporterId)) ||
    {};

  const consignee =
    consignees.find(
      (c) =>
        (c._id && String(c._id) === String(data.consignee)) ||
        normalize(c.name) === normalize(data.consignee) ||
        normalize(c.label)?.includes(normalize(data.consignee)),
    ) || {};

  const sellerCompanyName = pickFirst(
    data.supplierCompany,
    company.companyName,
    seller.companyName,
    "N/A",
  );
  const sellerName = pickFirst(seller.sellerName, data.sellerName, "N/A");
  const sellerPhone = pickFirst(
    seller?.phoneNumbers?.[0]?.value,
    seller?.mobileNo,
    seller.mobile,
    seller.phone,
    company?.mobileNo,
    company.mobile,
    "N/A",
  );
  const sellerEmail = pickFirst(
    seller?.emails?.[0]?.value,
    seller.email,
    seller.mailId,
    company.email,
    company.mailId,
    "N/A",
  );
  const sellerGstin = pickFirst(
    company.gstNo,
    company.gstin,
    seller.gstNumber,
    seller.gstin,
    "N/A",
  );
  const sellerAddress = pickFirst(
    company.address,
    seller.address,
    [company.city, company.state].filter(Boolean).join(", "),
    "N/A",
  );

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(203, 213, 225);
  doc.rect(0, 0, 2.5, pageHeight, "F");

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 48, "F");

  if (logo64) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 9, 30, 30, 3, 3, "F");
    doc.addImage(logo64, "PNG", 15, 12, 24, 24);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(String(sellerCompanyName).toUpperCase(), 47, 18);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(47, 20, 126, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Seller: ${sellerName}`, 47, 25);

  doc.setFontSize(7.9);
  doc.setTextColor(240, 240, 240);
  doc.text(`Email: ${sellerEmail}`, 47, 30);
  doc.text(`Contact: ${sellerPhone} | GSTIN: ${sellerGstin}`, 47, 34);
  doc.text(`Address: ${sellerAddress}`, 47, 38);

  doc.setFillColor(...accent);
  doc.roundedRect(pageWidth - 68, 12, 56, 12, 2, 2, "F");
  doc.setTextColor(...dark);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("LORRY CHALLAN", pageWidth - 40, 20, { align: "center" });

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DATE: ${formatDate(data.loadingDate)}`, pageWidth - 14, 34, {
    align: "right",
  });
  doc.text(`CHALLAN NO: ${data.billNumber || "N/A"}`, pageWidth - 14, 39, {
    align: "right",
  });

  const addressLines = [
    consignee.location,
    consignee.district,
    consignee.state,
    consignee.pin ? `PIN: ${consignee.pin}` : null,
  ].filter(Boolean);

  const fullAddress = addressLines.join(", ");
  const buyerCompanyName = pickFirst(
    buyer.companyName,
    buyer.buyerCompany,
    buyer.company,
    buyer.buyer,
    "N/A",
  );
  const buyerMobile = pickFirst(
    buyer.buyerMobile,
    buyer.mobile,
    buyer.phone,
    buyer.phoneNumber,
    "N/A",
  );
  const buyerEmail = pickFirst(
    buyer.buyerEmail,
    buyer?.buyerEmails?.[0],
    buyer.email,
    buyer.mailId,
    "N/A",
  );

  const addTable = (title, y, head, body, colors = tableBlue) => {
    // Centered ribbon title for a modern, compact look
    const ribbonH = 6.5;
    doc.setFillColor(...colors);
    doc.setDrawColor(...colors);
    doc.roundedRect(
      margin,
      y - ribbonH,
      pageWidth - margin * 2,
      ribbonH,
      2,
      2,
      "FD",
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(title.toUpperCase(), pageWidth / 2, y - 1.2, {
      align: "center",
    });

    autoTable(doc, {
      startY: y + 1.2,
      head: [head],
      body: [body],
      theme: "striped",
      headStyles: {
        fillColor: colors,
        textColor: 255,
        fontSize: 8.2,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8.3,
        textColor: [15, 23, 42],
        halign: "center",
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { halign: "left" },
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 3,
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: tableBlueLight,
      },
    });

    return doc.lastAutoTable.finalY + 8;
  };

  let currentY = 55;

  currentY = addTable(
    "Parties Information",
    currentY,
    ["Seller Name", "Seller Company", "Buyer Company", "Consignee Name"],
    [
      sellerName || "N/A",
      sellerCompanyName || "N/A",
      buyerCompanyName || "N/A",
      consignee.name || data.consignee || "N/A",
    ],
  );

  currentY = addTable(
    "Contact Details",
    currentY,
    ["Seller Contact", "Seller Email", "Buyer Contact", "Buyer Email"],
    [sellerPhone, sellerEmail, buyerMobile, buyerEmail],
  );

  doc.setFillColor(...light);
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.5);

  const addressText =
    fullAddress ||
    "Address details not found in database. Please verify Consignee record.";
  const splitAddress = doc.splitTextToSize(
    addressText,
    pageWidth - margin * 2 - 10,
  );
  const addressBlockHeight = Math.max(22, splitAddress.length * 5 + 12);

  doc.roundedRect(
    margin,
    currentY - 5,
    pageWidth - margin * 2,
    addressBlockHeight,
    2,
    2,
    "FD",
  );

  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DELIVERY ADDRESS", margin + 5, currentY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...dark);
  doc.text(splitAddress, margin + 5, currentY + 8);
  currentY += addressBlockHeight + 5;

  currentY = addTable(
    "Transport & Goods Details",
    currentY,
    ["Commodity", "Bags", "Weight", "Vehicle Number"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${data.loadingWeight || 0} Tons`,
      (data.lorryNumber || "N/A").toUpperCase(),
    ],
  );

  currentY = addTable(
    "Transporter Information",
    currentY,
    ["Transporter Name", "Driver Name", "Driver Contact", "Vehicle Number"],
    [
      transporter.name || data.addedTransport || "N/A",
      data.driverName || "N/A",
      data.driverPhoneNumber || transporter.mobile || "N/A",
      (data.lorryNumber || "N/A").toUpperCase(),
    ],
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
  );

  const signBaseY = pageHeight - 38;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...dark);

  doc.text("DRIVER'S SIGNATURE", margin + 5, signBaseY);
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(margin, signBaseY + 10, margin + 55, signBaseY + 10);

  doc.setTextColor(...primary);
  doc.text(`FOR ${String(sellerCompanyName).toUpperCase()}`, pageWidth - margin - 60, signBaseY, {
    align: "center",
  });

  if (sign64) {
    doc.addImage(sign64, "PNG", pageWidth - margin - 50, signBaseY + 2, 35, 12);
  }
  if (stamp64) {
    doc.setGState(new doc.GState({ opacity: 0.6 }));
    doc.addImage(
      stamp64,
      "PNG",
      pageWidth - margin - 65,
      signBaseY - 15,
      30,
      30,
    );
    doc.setGState(new doc.GState({ opacity: 1.0 }));
  }

  doc.setDrawColor(...primary);
  doc.line(
    pageWidth - margin - 65,
    signBaseY + 15,
    pageWidth - margin,
    signBaseY + 15,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("Authorized Signatory", pageWidth - margin - 32.5, signBaseY + 20, {
    align: "center",
  });

  doc.setFillColor(...primary);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  doc.setFillColor(...secondary);
  doc.rect(0, pageHeight - 8.5, pageWidth, 0.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    "Terms & Conditions: This is an electronic challan. Goods received in good condition.",
    pageWidth / 2,
    pageHeight - 3,
    { align: "center" },
  );

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;
