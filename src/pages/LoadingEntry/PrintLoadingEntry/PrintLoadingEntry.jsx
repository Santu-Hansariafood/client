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
    console.log("jsPDF initialized. Available methods:", Object.keys(doc).filter(k => typeof doc[k] === 'function').slice(0, 20));

    const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  const tableHead = [52, 52, 52];
  const tableRowAlt = [248, 248, 248];
  const tableBorder = [220, 220, 220];
  const deliveryBg = [245, 245, 245];

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
      
      // Add timeout to image loading
      const timeout = setTimeout(() => {
        console.warn("Image load timeout:", img);
        resolve(null);
      }, 5000);

      image.src = img;
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        clearTimeout(timeout);
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
        clearTimeout(timeout);
        console.error("Image load error for path:", img);
        resolve(null);
      };
    });

  console.log("Processing assets...");
  const [logo64] = await Promise.all([
    getBase64(logo),
  ]);

  console.log("Fetching additional data...");
  const [sellers, companies, consignees, transporters] =
    await Promise.all([
      safeFetch("/sellers?limit=0"),
      safeFetch("/seller-company?limit=0"),
      safeFetch("/consignees?limit=0"),
      safeFetch("/transporters?limit=0"),
    ]).catch((fetchErr) => {
      console.error("Failed to fetch additional data:", fetchErr);
      return [[], [], [], []];
    });
  console.log("Data fetch complete.", { sellers: sellers.length, companies: companies.length, consignees: consignees.length, transporters: transporters.length });

  const supplierId =
    typeof data.supplier === "object" ? data.supplier?._id : data.supplier;
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

  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, 3, pageHeight, "F");

  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, 42, pageWidth - margin, 42);

  if (logo64) {
    doc.addImage(logo64, "PNG", margin, 10, 22, 22);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(String(sellerCompanyName).toUpperCase(), 48, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(sellerTaxId, 48, 24);
  doc.text(`Address: ${sellerAddress}`, 48, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("LORRY CHALLAN", pageWidth / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Date: ${formatDate(data.loadingDate)}`, pageWidth - margin, 23, {
    align: "right",
  });
  doc.text(`Challan No: ${data.billNumber || "N/A"}`, pageWidth - margin, 29, {
    align: "right",
  });
  doc.text(`Vehicle: ${(data.lorryNumber || "N/A").toUpperCase()}`, pageWidth - margin, 35, {
    align: "right",
  });

  const addTable = (title, y, head, body, colors = tableHead) => {
    try {
      if (!colors || colors.length < 3) colors = [52, 52, 52];
      const ribbonH = 7;
      doc.setFillColor(Number(colors[0]), Number(colors[1]), Number(colors[2]));
      doc.rect(
        margin,
        y - ribbonH,
        pageWidth - margin * 2,
        ribbonH,
        "F",
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(title.toUpperCase(), pageWidth / 2, y - 1.5, {
        align: "center",
      });

      const autoTableOptions = {
        startY: y + 1.5,
        head: [head],
        body: [body],
        theme: "striped",
        tableWidth: "auto",
        headStyles: {
          fillColor: colors,
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: 50,
          halign: "center",
          valign: "middle",
          cellPadding: 3,
        },
        columnStyles: {
          0: { halign: "left", cellPadding: [3, 3, 3, 6] },
          1: { cellPadding: 3 },
        },
        margin: { left: margin, right: margin, top: 0, bottom: 0 },
        styles: {
          cellPadding: 3,
          overflow: "linebreak",
          lineColor: [220, 220, 220],
          lineWidth: 0.15,
        },
        alternateRowStyles: {
          fillColor: tableRowAlt,
        },
        didParseCell: function(data) {
          if (data.section === 'head') {
            data.cell.styles.cellPadding = 3;
          }
        },
      };

      if (typeof doc.autoTable === 'function') {
        doc.autoTable(autoTableOptions);
      } else {
        autoTable(doc, autoTableOptions);
      }

      return (doc.lastAutoTable?.finalY || y + 20) + 10;
    } catch (tableErr) {
      console.error(`Error adding table ${title}:`, tableErr);
      return y + 25;
    }
  };

  let currentY = 52;

  console.log("Drawing tables...");
  // 1. Seller Information
  console.log("Adding Seller Information table...");
  currentY = addTable(
    "Seller Information",
    currentY,
    ["Seller Company", "Seller Address", "GSTIN/PAN"],
    [sellerCompanyName, sellerAddress, sellerTaxId.replace("GSTIN: ", "").replace("PAN: ", "")],
  );

  // 2. Delivery Address
  console.log("Processing Delivery Address...");
  const deliveryPlace = pickFirst(
    data.placeOfDelivery,
    data.deliveryPlace,
    data.deliveryLocation,
    data.deliveryCity,
    data.unloadingPoint,
    data.destination,
    "N/A"
  );
  const deliveryAddressFull = pickFirst(
    data.deliveryAddress,
    data.address,
    "N/A"
  );
  const deliveryDistrict = pickFirst(
    data.deliveryDistrict,
    data.district,
    "N/A"
  );
  const deliveryState = pickFirst(
    data.deliveryState,
    data.state,
    consignee.state,
    "N/A"
  );
  const deliveryPin = pickFirst(
    data.deliveryPin,
    data.deliveryPinCode,
    data.pin,
    data.pinCode,
    consignee.pin,
    "N/A"
  );

  currentY = addTable(
    "Delivery Address",
    currentY,
    ["Place/City", "Full Address", "District, State, PIN"],
    [
      deliveryPlace,
      deliveryAddressFull,
      `${deliveryDistrict}, ${deliveryState}, ${deliveryPin}`.replace(/, N\/A/g, "").replace(/^, /, "") || "N/A",
    ],
  );

  // 3. Buyer Details (Consignee)
  console.log("Adding Buyer Details table...");
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
  console.log("Adding Description of Goods table...");
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
  console.log("Adding Transporter Information table...");
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
  console.log("Adding Freight Summary table...");
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

  console.log("Adding signatures and footer...");

  const signBaseY = pageHeight - 35;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text("DRIVER SIGNATURE", margin + 5, signBaseY);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, signBaseY + 5, margin + 50, signBaseY + 5);

  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `For ${String(sellerCompanyName).toUpperCase()}`,
    pageWidth - margin - 55,
    signBaseY,
    { align: "center" },
  );
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 60, signBaseY + 5, pageWidth - margin, signBaseY + 5);
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Authorized Signatory", pageWidth - margin - 30, signBaseY + 10, {
    align: "center",
  });

  doc.setFillColor(248, 248, 248);
  doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Terms & Conditions: This is a system-generated challan. The seller is responsible for all details. Hansaria Food Private Limited holds no liability.",
    pageWidth / 2,
    pageHeight - 6,
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
