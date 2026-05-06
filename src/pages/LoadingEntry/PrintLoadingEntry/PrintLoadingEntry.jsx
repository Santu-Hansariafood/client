import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../utils/apiClient/apiClient";

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const buildSaudaAddress = (sauda, prefix) => {
  const parts = [];
  if (sauda[`${prefix}Location`]) parts.push(sauda[`${prefix}Location`]);
  if (sauda[`${prefix}District`]) parts.push(sauda[`${prefix}District`]);
  if (sauda[`${prefix}State`]) parts.push(sauda[`${prefix}State`]);
  if (sauda[`${prefix}PinCode`]) parts.push(sauda[`${prefix}PinCode`]);
  return parts.length ? parts.join(", ") : null;
};

const PrintLoadingEntry = async (entry) => {
  try {
    let sauda = null;

    if (entry.saudaNo) {
      try {
        const response = await api.get("/self-order", {
          params: { limit: 0 }
        });

        let saudaData = [];
        if (Array.isArray(response.data)) {
          saudaData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          saudaData = response.data.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          saudaData = response.data.items;
        }

        sauda = saudaData.find((s) => String(s.saudaNo) === String(entry.saudaNo));
      } catch (e) {
        console.log("Sauda not found, using entry data");
      }
    }

    const data = sauda || entry;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("LORRY CHALLAN", pageWidth / 2, 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(new Date())}`, pageWidth - margin - 30, 30, { align: "right" });
    doc.text(`Sauda No: ${data.saudaNo || "N/A"}`, margin, 35);
    if (entry.loadingDate) {
      doc.text(`Loading Date: ${formatDate(entry.loadingDate)}`, margin, 40);
    }
    if (entry.billNumber) {
      doc.text(`Bill No: ${entry.billNumber}`, margin, 45);
    }

    const buyerName = data.buyerCompany || data.buyerName || "N/A";
    const buyerAddress = data.buyerAddress || data.deliveryAddress || buildSaudaAddress(data, "buyer") || buildSaudaAddress(data, "delivery") || "N/A";
    const buyerGst = data.buyerGstNo || data.buyerGstNumber || data.gstNo || "";

    const consigneeName = data.consigneeName || data.shipToName || data.consignee?.name || data.shipTo?.name || "N/A";
    const consigneeAddress = data.consigneeAddress || data.shipToAddress || buildSaudaAddress(data, "consignee") || buildSaudaAddress(data, "shipTo") || "N/A";
    const consigneeGst = data.consigneeGstNo || data.shipToGstNo || data.consignee?.gstNo || data.consignee?.gstNumber || "";
    const consigneePan = data.consigneePanNo || data.shipToPanNo || data.consignee?.panNo || data.consignee?.panNumber || "";
    const consigneeMobile = data.consigneeMobile || data.shipToMobile || data.consignee?.phone || data.consignee?.mobile || "";

    doc.setLineWidth(0.5);
    doc.rect(margin, 50, contentWidth, 40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BUYER ACCOUNT", margin + 5, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${buyerName}`, margin + 5, 65);
    doc.text(`Address: ${buyerAddress}`, margin + 5, 72);
    if (buyerGst) {
      doc.text(`GST: ${buyerGst}`, margin + 5, 79);
    }

    doc.rect(margin, 95, contentWidth, 45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SHIP TO (CONSIGNEE)", margin + 5, 103);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${consigneeName}`, margin + 5, 110);
    doc.text(`Address: ${consigneeAddress}`, margin + 5, 117);
    if (consigneeMobile) {
      doc.text(`Mobile: ${consigneeMobile}`, margin + 5, 124);
    }
    if (consigneeGst) {
      doc.text(`GST: ${consigneeGst}`, margin + 5, 131);
    }
    if (consigneePan) {
      doc.text(`PAN: ${consigneePan}`, margin + 80, 131);
    }

    const tableStartY = 150;
    const tableData = [
      ["Seller Company", data.supplierCompany || "N/A"],
      ["Commodity", data.commodity || entry.commodity || "N/A"],
      ["Quantity", `${data.quantity || entry.loadingWeight || 0} Tons`],
      ["Broker", data.brokerName || "Hansaria Food Private Limited"],
    ];

    if (entry.lorryNumber) {
      tableData.push(["Lorry No", entry.lorryNumber]);
    }
    if (entry.addedTransport) {
      tableData.push(["Transporter", entry.addedTransport]);
    }
    if (entry.driverName) {
      tableData.push(["Driver", entry.driverName]);
    }
    if (entry.driverPhoneNumber) {
      tableData.push(["Driver Phone", entry.driverPhoneNumber]);
    }

    autoTable(doc, {
      startY: tableStartY,
      head: [["Particulars", "Details"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: 0,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      }
    });

    const finalY = (doc.lastAutoTable?.finalY || tableStartY) + 20;
    doc.setFontSize(9);
    doc.setLineWidth(0.3);

    doc.line(margin, finalY, pageWidth / 2 - 5, finalY);
    doc.text("Driver Signature", margin, finalY + 5);

    doc.line(pageWidth / 2 + 5, finalY, pageWidth - margin, finalY);
    doc.text("Authorized Signature", pageWidth / 2 + 10, finalY + 5, { align: "left" });

    return doc;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return null;
  }
};

export default PrintLoadingEntry;
