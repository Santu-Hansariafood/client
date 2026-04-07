import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import logo from "../../../assets/Hans.webp";

const PrintLoadingEntry = async (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  const logoWidth = 30;
  const logoHeight = 20;
  doc.addImage(logo, "PNG", 15, 15, logoWidth, logoHeight);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 54, 93);
  doc.text("LORRY CHALLAN", pageWidth - 15, 25, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(74, 85, 104);
  doc.text("HANSARIA FOOD PVT. LTD.", pageWidth - 15, 30, { align: "right" });
  doc.text("Broker and Commission Agent", pageWidth - 15, 34, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 42, pageWidth - 15, 42);

  const [ordersRes, sellersRes, companiesRes, consigneesRes] = await Promise.all([
    axios.get("/self-order"),
    axios.get("/sellers"),
    axios.get("/seller-company"),
    axios.get("/consignees"),
  ]);

  const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data || []);
  const sellersData = Array.isArray(sellersRes.data) ? sellersRes.data : (sellersRes.data?.data || []);
  const companiesData = Array.isArray(companiesRes.data) ? companiesRes.data : (companiesRes.data?.data || []);
  const consigneesData = Array.isArray(consigneesRes.data) ? consigneesRes.data : (consigneesRes.data?.data || []);

  const supplierId = typeof data.supplier === 'object' ? data.supplier?._id : data.supplier;

  const buyerDetails = ordersData.find((order) => order.saudaNo === data.saudaNo) || {};
  const sellerDetails = sellersData.find((seller) => String(seller._id) === String(supplierId)) || {};
  const companyDetails =
    companiesData.find(
      (company) =>
        company.companyName?.trim().toLowerCase() ===
        (sellerDetails.companies?.[0] || "").trim().toLowerCase()
    ) || {};
  const consigneeDetails =
    consigneesData.find(
      (consignee) =>
        consignee.name?.trim().toLowerCase() === data.consignee?.trim().toLowerCase()
    ) || {};

  const addTableSection = (title, yPosition, headers, body) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(title.toUpperCase(), 15, yPosition);
    
    doc.autoTable({
      startY: yPosition + 2,
      head: [headers],
      body: [body],
      theme: "striped",
      headStyles: { 
        fillColor: [26, 54, 93], 
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        cellPadding: 2
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [45, 55, 72],
        cellPadding: 2
      },
      margin: { left: 15, right: 15 },
      styles: { overflow: 'linebreak' }
    });
    return doc.autoTable.previous.finalY + 8;
  };

  let yPosition = 50;
  yPosition = addTableSection("Seller & PO Details", yPosition, ["Seller Name", "GST No", "Challan No", "Date", "Buyer PO No"], [
    sellerDetails.sellerName || "N/A",
    companyDetails.gstNo || "N/A",
    data.billNumber,
    new Date(data.loadingDate).toLocaleDateString(),
    data.saudaNo || "N/A",
  ]);

  yPosition = addTableSection("Buyer & Delivery", yPosition, ["Buyer Name", "Consignee", "Delivery Address"], [
    buyerDetails.buyer || "N/A",
    data.consignee,
    consigneeDetails.location || "N/A",
  ]);

  yPosition = addTableSection("Goods & Transport", yPosition, ["Product", "Bags", "Weight", "Lorry No", "Transport"], [
    data.commodity,
    data.bags || "N/A",
    `${data.loadingWeight} TONS`,
    data.lorryNumber,
    data.addedTransport,
  ]);

  yPosition = addTableSection("Freight Summary", yPosition, ["Rate", "Total Freight", "Advance", "Balance Due"], [
    `Rs. ${data.freightRate}`,
    `Rs. ${data.totalFreight}`,
    `Rs. ${data.advance}`,
    `Rs. ${data.totalFreight - data.advance}`,
  ]);

  yPosition += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 54, 93);
  doc.text("Driver Signature", 15, yPosition);
  doc.setDrawColor(45, 55, 72);
  doc.line(15, yPosition + 12, 60, yPosition + 12);

  doc.text("Authorized Signatory", pageWidth - 15, yPosition, { align: "right" });
  doc.line(pageWidth - 60, yPosition + 12, pageWidth - 15, yPosition + 12);

  doc.setFontSize(7);
  doc.setTextColor(113, 128, 150);
  doc.text(
    "* This is a computer-generated document and does not require a physical signature.",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
};

export default PrintLoadingEntry;
