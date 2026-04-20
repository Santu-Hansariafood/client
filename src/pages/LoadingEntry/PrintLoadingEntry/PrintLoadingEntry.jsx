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

  const primary = [0, 0, 0];
  const secondary = [60, 60, 60];
  const accent = [100, 100, 100];
  const tableHead = [40, 40, 40];
  const tableRowAlt = [245, 245, 245];
  const dark = [0, 0, 0];
  const light = [255, 255, 255];
  const gray = [100, 100, 100];

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
    company.gstNumber,
    company.gstin,
    seller.gstNumber,
    seller.gstin,
    data.sellerGstin,
    data.gst,
    "NOT AVAILABLE",
  );

  const consigneeGst = pickFirst(
    consignee.gst,
    consignee.gstin,
    data.consigneeGst,
    "NOT AVAILABLE",
  );

  const sellerAddress = [
    company.location || seller.location,
    company.district || seller.district,
    company.state || seller.state,
    company.pinCode || company.pin || seller.pinCode || seller.pin,
  ]
    .filter(Boolean)
    .join(", ") || "N/A";

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // No sidebar/header bars for simple challan
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, 10, pageWidth - margin * 2, 38);

  if (logo64) {
    doc.addImage(logo64, "PNG", 16, 12, 24, 24);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(String(sellerCompanyName).toUpperCase(), 47, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Seller: ${sellerName}`, 47, 24);

  doc.setFontSize(8);
  doc.text(`Email: ${sellerEmail}`, 47, 29);
  doc.text(`Contact: ${sellerPhone} | GSTIN: ${sellerGstin}`, 47, 33);
  doc.text(`Address: ${sellerAddress}`, 47, 37);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LORRY CHALLAN", pageWidth - margin - 5, 20, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`DATE: ${formatDate(data.loadingDate)}`, pageWidth - margin - 5, 34, {
    align: "right",
  });
  doc.text(`CHALLAN NO: ${data.billNumber || "N/A"}`, pageWidth - margin - 5, 39, {
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

  const addTable = (title, y, head, body) => {
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin, y - 2);

    autoTable(doc, {
      startY: y,
      head: [head],
      body: [body],
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.1,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [0, 0, 0],
        halign: "center",
        lineWidth: 0.1,
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

  // 1. Seller Information
  currentY = addTable(
    "Seller Information",
    currentY,
    ["Seller Name", "Seller Address", "Seller Contact", "Seller GSTIN"],
    [sellerName, sellerAddress, sellerPhone, sellerGstin],
  );

  // 2. Delivery Address (On top as requested)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);

  const deliveryAddressText = [
    consignee.location || data.location,
    consignee.district || data.district,
    consignee.state || data.state,
    consignee.pin || data.pin,
  ]
    .filter(Boolean)
    .join(", ") || "Address details not found.";

  const splitDeliveryAddress = doc.splitTextToSize(
    deliveryAddressText,
    pageWidth - margin * 2 - 10,
  );
  const deliveryBlockHeight = Math.max(18, splitDeliveryAddress.length * 5 + 10);

  doc.roundedRect(
    margin,
    currentY - 5,
    pageWidth - margin * 2,
    deliveryBlockHeight,
    2,
    2,
    "S",
  );

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DELIVERY ADDRESS", margin + 5, currentY + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(splitDeliveryAddress, margin + 5, currentY + 6);
  currentY += deliveryBlockHeight + 5;

  // 3. Buyer Details (Consignee)
  const consigneeAddress = [
    consignee.location,
    consignee.district,
    consignee.state,
    consignee.pin,
  ].filter(Boolean).join(", ") || "N/A";

  currentY = addTable(
    "Buyer Details (Consignee)",
    currentY,
    ["Consignee Name", "Consignee Address", "Consignee GST", "Buyer Contact"],
    [
      consignee.name || data.consignee || "N/A",
      consigneeAddress,
      consigneeGst,
      buyerMobile || "N/A",
    ],
  );

  // 4. Description of Goods
  currentY = addTable(
    "Description of Goods",
    currentY,
    ["Commodity", "Bags", "Weight (Tons)", "Vehicle Number"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${data.loadingWeight || 0} Tons`,
      (data.lorryNumber || "N/A").toUpperCase(),
    ],
  );

  // 5. Transporter Information
  currentY = addTable(
    "Full Transporter Details",
    currentY,
    ["Transporter Name", "Driver Name", "Driver Contact", "Vehicle Number"],
    [
      transporter.name || data.addedTransport || "N/A",
      data.driverName || "N/A",
      data.driverPhoneNumber || transporter.mobile || "N/A",
      (data.lorryNumber || "N/A").toUpperCase(),
    ],
  );

  // 6. Freight & Payment Summary (Keeping this for completeness)
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
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, signBaseY + 10, margin + 55, signBaseY + 10);

  doc.setTextColor(0, 0, 0);
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

  doc.setDrawColor(0, 0, 0);
  doc.line(
    pageWidth - margin - 65,
    signBaseY + 15,
    pageWidth - margin,
    signBaseY + 15,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text("Authorized Signatory", pageWidth - margin - 32.5, signBaseY + 20, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(
    "Terms & Conditions: This is an electronic challan. Goods received in good condition.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );

  return URL.createObjectURL(doc.output("blob"));
};

export default PrintLoadingEntry;
