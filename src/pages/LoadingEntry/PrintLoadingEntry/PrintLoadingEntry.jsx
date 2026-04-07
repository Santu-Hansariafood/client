import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import logo from "../../../assets/Hans.png";

const PrintLoadingEntry = async (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  /* ---------------------- Helpers ---------------------- */

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
    `₹ ${Number(val || 0).toLocaleString("en-IN")}`;

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

  /* ---------------------- Layout ---------------------- */

  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  /* ---------------------- Logo ---------------------- */

  const logoBase64 = await getBase64Image(logo);
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 15, 15, 30, 20);
  }

  /* ---------------------- Header ---------------------- */

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 54, 93);
  doc.text("LORRY CHALLAN", pageWidth - 15, 25, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(74, 85, 104);
  doc.text("HANSARIA FOOD PVT. LTD.", pageWidth - 15, 30, {
    align: "right",
  });
  doc.text("Broker and Commission Agent", pageWidth - 15, 34, {
    align: "right",
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 42, pageWidth - 15, 42);

  /* ---------------------- Fetch Data ---------------------- */

  const [ordersData, sellersData, companiesData, consigneesData] =
    await Promise.all([
      safeFetch("/self-order"),
      safeFetch("/sellers"),
      safeFetch("/seller-company"),
      safeFetch("/consignees"),
    ]);

  const supplierId =
    typeof data.supplier === "object"
      ? data.supplier?._id
      : data.supplier;

  const buyerDetails =
    ordersData.find((o) => o.saudaNo === data.saudaNo) || {};

  const sellerDetails =
    sellersData.find((s) => String(s._id) === String(supplierId)) || {};

  const sellerCompanyName =
    data.supplierCompany || sellerDetails.companies?.[0] || "";

  const companyDetails =
    companiesData.find(
      (c) => normalize(c.companyName) === normalize(sellerCompanyName)
    ) || {};

  const consigneeDetails =
    consigneesData.find(
      (c) => normalize(c.name) === normalize(data.consignee)
    ) || {};

  /* ---------------------- Table Helper ---------------------- */

  const addTableSection = (title, y, headers, body) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(title.toUpperCase(), 15, y);

    doc.autoTable({
      startY: y + 2,
      head: [headers],
      body: [body],
      theme: "striped",
      pageBreak: "auto",
      headStyles: {
        fillColor: [26, 54, 93],
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [45, 55, 72],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      styles: {
        overflow: "linebreak",
        cellPadding: 3,
      },
      margin: { left: 15, right: 15 },
    });

    return doc.lastAutoTable.finalY + 8;
  };

  /* ---------------------- Data Sections ---------------------- */

  let y = 50;

  y = addTableSection(
    "Seller & PO Details",
    y,
    ["Seller Name", "GST No", "Challan No", "Date", "Buyer PO No"],
    [
      sellerDetails.sellerName || "N/A",
      companyDetails.gstNo || "N/A",
      data.billNumber || "N/A",
      formatDate(data.loadingDate),
      data.saudaNo || "N/A",
    ]
  );

  y = addTableSection(
    "Buyer & Delivery",
    y,
    ["Buyer Name", "Consignee", "Delivery Address"],
    [
      buyerDetails.buyer || "N/A",
      data.consignee || "N/A",
      consigneeDetails.location || "N/A",
    ]
  );

  y = addTableSection(
    "Goods & Transport",
    y,
    ["Product", "Bags", "Weight", "Lorry No", "Transport"],
    [
      data.commodity || "N/A",
      data.bags || "N/A",
      `${Number(data.loadingWeight || 0)} TONS`,
      data.lorryNumber || "N/A",
      data.addedTransport || "N/A",
    ]
  );

  const totalFreight = Number(data.totalFreight) || 0;
  const advance = Number(data.advance) || 0;
  const balance = totalFreight - advance;

  y = addTableSection(
    "Freight Summary",
    y,
    ["Rate", "Total Freight", "Advance", "Balance Due"],
    [
      formatCurrency(data.freightRate),
      formatCurrency(totalFreight),
      formatCurrency(advance),
      formatCurrency(balance),
    ]
  );

  /* ---------------------- Signatures ---------------------- */

  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Driver Signature", 15, y);
  doc.line(15, y + 12, 60, y + 12);

  doc.text("Authorized Signatory", pageWidth - 15, y, {
    align: "right",
  });
  doc.line(pageWidth - 60, y + 12, pageWidth - 15, y + 12);

  /* ---------------------- Footer ---------------------- */

  doc.setFontSize(7);
  doc.setTextColor(113, 128, 150);
  doc.text(
    "* This is a computer-generated document and does not require a physical signature.",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  /* ---------------------- Output ---------------------- */

  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
};

export default PrintLoadingEntry;
