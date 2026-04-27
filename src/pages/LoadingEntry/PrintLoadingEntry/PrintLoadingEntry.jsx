import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";
import logo from "../../../assets/Hans.png";

const PrintLoadingEntry = async (data) => {
  if (!data) {
    console.error("No data provided to PrintLoadingEntry");
    toast.error("No data available for PDF generation");
    return null;
  }
  console.log("Starting PDF generation for:", data?.billNumber || "N/A");
  try {
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
      console.log(`Fetching: ${url}`);
      const res = await api.get(url, { timeout: 15000 });
      console.log(`Fetched: ${url} (count: ${res.data?.length || res.data?.data?.length || 0})`);
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    } catch (err) {
      console.warn(`Could not fetch data from ${url}, using defaults.`, err);
      return [];
    }
  };

  const getBase64 = (img) =>
    new Promise((resolve) => {
      if (!img) {
        console.warn("No image path provided to getBase64");
        return resolve(null);
      }
      console.log("Loading image:", img);
      const image = new Image();
      image.src = img;
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        try {
          console.log("Image loaded successfully:", img);
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          console.error("Canvas error for image:", img, e);
          resolve(null);
        }
      };

      image.onerror = () => {
        console.error("Image load error for path:", img);
        resolve(null);
      };
    });

  console.log("Processing assets...");
  const [logo64] = await Promise.all([
    getBase64(logo),
  ]);

  console.log("Fetching additional data...");
  const [orders, sellers, companies, consignees, transporters] =
    await Promise.all([
      safeFetch("/self-order?limit=0"),
      safeFetch("/sellers?limit=0"),
      safeFetch("/seller-company?limit=0"),
      safeFetch("/consignees?limit=0"),
      safeFetch("/transporters?limit=0"),
    ]);
  console.log("Data fetch complete.");

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
    data.sellerPhone,
    data.sellerContact,
    seller?.phoneNumbers?.[0]?.value,
    seller?.mobileNo,
    seller.mobile,
    seller.phone,
    company?.mobileNo,
    company.mobile,
    "N/A",
  );
  const sellerEmail = pickFirst(
    data.sellerEmail,
    data.sellerMail,
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

  const sellerPan = pickFirst(
    company.panNumber,
    company.pan,
    seller.panNumber,
    seller.pan,
    data.sellerPan,
    "NOT AVAILABLE",
  );

  const sellerTaxId = sellerGstin !== "NOT AVAILABLE" 
    ? `GSTIN: ${sellerGstin}` 
    : (sellerPan !== "NOT AVAILABLE" ? `PAN: ${sellerPan}` : "GSTIN/PAN: NOT AVAILABLE");

  const consigneeGst = pickFirst(
    consignee.gst,
    consignee.gstin,
    data.consigneeGst,
    "NOT AVAILABLE",
  );
  
  const consigneePan = pickFirst(
    consignee.pan,
    consignee.panNumber,
    data.consigneePan,
    "NOT AVAILABLE",
  );

  const consigneeTaxId = consigneeGst !== "NOT AVAILABLE" 
    ? consigneeGst 
    : (consigneePan !== "NOT AVAILABLE" ? consigneePan : "NOT AVAILABLE");

  const sellerAddress =
    [
      company.location || seller.location,
      company.district || seller.district,
      company.state || seller.state,
      company.pinCode || company.pin || seller.pinCode || seller.pin,
    ]
      .filter(Boolean)
      .join(", ") || "N/A";

  console.log("Drawing header...");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(220, 220, 220);
  doc.rect(0, 0, 2.5, pageHeight, "F");

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 48, "F");
  doc.setDrawColor(200, 200, 200); // Lighter line
  doc.setLineWidth(0.2);
  doc.line(margin, 48, pageWidth - margin, 48);

  if (logo64) {
    doc.addImage(logo64, "PNG", 15, 12, 24, 24);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(String(sellerCompanyName).toUpperCase(), 47, 22);

  doc.setDrawColor(200, 200, 200); // Lighter line
  doc.setLineWidth(0.5);
  doc.line(47, 24, 140, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(sellerTaxId, 47, 29);
  doc.text(`Address: ${sellerAddress}`, 47, 34);

  doc.setFillColor(240, 240, 240);
  doc.setDrawColor(240, 240, 240); // Match fill color to hide border
  doc.roundedRect(pageWidth - 68, 12, 56, 12, 2, 2, "FD");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("LORRY CHALLAN", pageWidth - 40, 20, { align: "center" });

  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
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

  const addTable = (title, y, head, body, colors = tableHead) => {
    try {
      if (!colors || colors.length < 3) colors = [40, 40, 40];
      // Centered ribbon title for a modern, compact look
      const ribbonH = 6.5;
      doc.setFillColor(Number(colors[0]), Number(colors[1]), Number(colors[2]));
      doc.setDrawColor(Number(colors[0]), Number(colors[1]), Number(colors[2])); // Match fill color to hide border
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
          textColor: 0,
          halign: "center",
          lineColor: 230,
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
        alternateRowStyles: {
          fillColor: tableRowAlt,
        },
      });

      return (doc.lastAutoTable?.finalY || y + 20) + 8;
    } catch (tableErr) {
      console.error(`Error adding table ${title}:`, tableErr);
      return y + 25;
    }
  };

  let currentY = 55;

  console.log("Drawing tables...");
  // 1. Seller Information
  currentY = addTable(
    "Seller Information",
    currentY,
    ["Seller Company", "Seller Address", "GSTIN/PAN"],
    [sellerCompanyName, sellerAddress, sellerTaxId.replace("GSTIN: ", "").replace("PAN: ", "")],
  );

  // 2. Delivery Address (On top as requested)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200); // Lighter line
  doc.setLineWidth(0.2);

  const deliveryAddressText =
      pickFirst(
        data.deliveryAddress,
        data.unloadingPoint,
        data.destination,
        data.address,
        [
          consignee.location || data.location,
          consignee.district || data.district,
          consignee.state || data.state,
          consignee.pin || data.pin,
        ]
          .filter(Boolean)
          .join(", ")
      ) || "Address details not found.";

  const splitDeliveryAddress = doc.splitTextToSize(
    deliveryAddressText,
    pageWidth - margin * 2 - 10,
  );
  const deliveryBlockHeight = Math.max(
    18,
    splitDeliveryAddress.length * 5 + 10,
  );

  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(245, 245, 245); // No black border
  doc.roundedRect(
    margin,
    currentY - 5,
    pageWidth - margin * 2,
    deliveryBlockHeight,
    2,
    2,
    "FD",
  );

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DELIVERY ADDRESS", margin + 5, currentY + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(splitDeliveryAddress, margin + 5, currentY + 6);
  currentY += deliveryBlockHeight + 5;

  // 3. Buyer Details (Consignee)
  const consigneeAddress =
    [consignee.location, consignee.district, consignee.state, consignee.pin]
      .filter(Boolean)
      .join(", ") || "N/A";

  currentY = addTable(
    "Buyer Details (Consignee)",
    currentY,
    ["Consignee Name", "Consignee Address", "GSTIN/PAN"],
    [
      consignee.name || data.consignee || "N/A",
      consigneeAddress,
      consigneeTaxId,
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
  doc.setTextColor(0, 0, 0);
  
  doc.text("DRIVER'S SIGNATURE", margin + 5, signBaseY);
  doc.setDrawColor(200, 200, 200); // Lighter line
  doc.setLineWidth(0.5);
  doc.line(margin, signBaseY + 10, margin + 55, signBaseY + 10);

  doc.setTextColor(0, 0, 0);
  doc.text(
    `FOR ${String(sellerCompanyName).toUpperCase()}`,
    pageWidth - margin - 60,
    signBaseY,
    {
      align: "center",
    },
  );

  doc.setDrawColor(200, 200, 200); // Lighter line
  doc.line(
    pageWidth - margin - 65,
    signBaseY + 15,
    pageWidth - margin,
    signBaseY + 15,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Authorized Signatory", pageWidth - margin - 32.5, signBaseY + 20, {
    align: "center",
  });

  doc.setFillColor(230, 230, 230);
  doc.rect(0, pageHeight - 12, pageWidth, 12, "F");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.text(
    "Terms & Conditions: This is an electronic challan by using Hansaria Food Private Limited platform. Seller Must Be Reliable for this; Hansaria Food is Not liable.",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center", maxWidth: pageWidth - margin * 2 },
  );

  console.log("PDF generation successful.");
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Critical error in PrintLoadingEntry:", err);
    throw err;
  }
};

export default PrintLoadingEntry;
