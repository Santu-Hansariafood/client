import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import logo from "../../../assets/Hans.webp";

const PrintLoadingEntry = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      doc.setDrawColor(0);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      const logoWidth = 40;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logo, "PNG", logoX, 5, logoWidth, logoHeight);

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("LORRY CHALLAN", pageWidth / 2, 35, { align: "center" });

      doc.line(10, 40, pageWidth - 10, 40);

      const [orders, sellers, companies, consignees] = await Promise.all([
        axios.get("https://api.hansariafood.shop/api/self-order"),
        axios.get("https://api.hansariafood.shop/api/sellers"),
        axios.get("https://api.hansariafood.shop/api/seller-company"),
        axios.get("https://api.hansariafood.shop/api/consignees"),
      ]);

      const buyerDetails = orders.data.find((order) => order.saudaNo === data.saudaNo) || {};
      const sellerDetails = sellers.data.find((seller) => seller._id === data.supplier) || {};
      const companyDetails =
        companies.data.data.find(
          (company) =>
            company.companyName.trim().toLowerCase() ===
            (sellerDetails.companies?.[0] || "").trim().toLowerCase()
        ) || {};
      const consigneeDetails =
        consignees.data.find(
          (consignee) =>
            consignee.name.trim().toLowerCase() === data.consignee.trim().toLowerCase()
        ) || {};

      const addTableSection = (title, yPosition, headers, body) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, 10, yPosition);
        doc.autoTable({
          startY: yPosition + 5,
          head: [headers],
          body: [body],
          theme: "grid",
          headStyles: { fillColor: [34, 139, 34] }, // Green color
        });
        return doc.autoTable.previous.finalY + 10;
      };

      let yPosition = 45;
      yPosition = addTableSection("Seller Details", yPosition, ["Seller Name", "Company", "GST No", "Address"], [
        sellerDetails.sellerName || "N/A",
        sellerDetails.companies?.join(", ") || "N/A",
        companyDetails.gstNo || "N/A",
        companyDetails.address || "N/A",
      ]);

      yPosition = addTableSection("PO Details", yPosition, ["Challan No", "Date", "GSTIN", "Buyer PO No"], [
        data.billNumber,
        new Date(data.loadingDate).toLocaleDateString(),
        companyDetails.gstNo || "N/A",
        data.saudaNo || "N/A",
      ]);

      yPosition = addTableSection("Delivery Address", yPosition, ["Consignee", "Address"], [
        data.consignee,
        consigneeDetails.location || "N/A",
      ]);

      yPosition = addTableSection("Buyer Details", yPosition, ["Buyer Name", "Buyer Company"], [
        buyerDetails.buyer || "N/A",
        buyerDetails.buyerCompany || "N/A",
      ]);

      yPosition = addTableSection("Goods Description", yPosition, ["Product", "Bags", "Weight (Tons)"], [
        data.commodity,
        data.bags || "N/A",
        data.loadingWeight,
      ]);

      yPosition = addTableSection("Transport Details", yPosition, ["Lorry Number", "Transport", "Driver Name", "Driver Phone"], [
        data.lorryNumber,
        data.addedTransport,
        data.driverName,
        data.driverPhoneNumber,
      ]);

      yPosition = addTableSection("Freight Details", yPosition, ["Freight Rate", "Total Freight", "Advance Paid", "Balance Due"], [
        `Rs. ${data.freightRate}`,
        `Rs. ${data.totalFreight}`,
        `Rs. ${data.advance}`,
        `Rs. ${data.totalFreight - data.advance}`,
      ]);

      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Driver Signature", 10, yPosition);
      doc.line(20, yPosition + 5, 120, yPosition + 5);

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "*This is a system-generated document and does not require a signature.*",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      const pdfBlob = doc.output("blob");
      const fileUrl = URL.createObjectURL(pdfBlob);
      resolve(fileUrl);
    } catch (error) {
      reject(error);
    }
  });
};

export default PrintLoadingEntry;
