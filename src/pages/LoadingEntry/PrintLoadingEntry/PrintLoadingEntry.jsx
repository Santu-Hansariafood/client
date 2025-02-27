import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";

const PrintLoadingEntry = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      doc.setDrawColor(0);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("LORRY CHALLAN", pageWidth / 2, 15, { align: "center" });
      doc.line(10, 20, pageWidth - 10, 20);

      const watermarkImg = new Image();
      watermarkImg.src = "../../../assets/Hans.jpg";
      watermarkImg.onload = () => {
        const imgWidth = 100;
        const imgHeight = 100;
        const centerX = (doc.internal.pageSize.width - imgWidth) / 2;
        const centerY = (doc.internal.pageSize.height - imgHeight) / 2;

        doc.addImage(
          watermarkImg,
          "JPEG",
          centerX,
          centerY,
          imgWidth,
          imgHeight,
          "",
          "FAST"
        );
      };

      let buyerDetails = null;
      try {
        const response = await axios.get(
          "http://localhost:5000/api/self-order"
        );
        buyerDetails = response.data.find(
          (order) => order.saudaNo === data.saudaNo
        );
      } catch (error) {
        console.error("Error fetching buyer details:", error);
      }

      let sellerDetails = null;
      try {
        const sellerResponse = await axios.get(
          "http://localhost:5000/api/sellers"
        );
        sellerDetails = sellerResponse.data.find(
          (seller) => seller._id === data.supplier
        );
      } catch (error) {
        console.error("Error fetching seller details:", error);
      }

      let companyDetails = null;
      if (sellerDetails) {
        try {
          const companyResponse = await axios.get(
            "http://localhost:5000/api/seller-company"
          );
          companyDetails = companyResponse.data.data.find(
            (company) =>
              company.companyName.trim().toLowerCase() ===
              sellerDetails.companies[0].trim().toLowerCase()
          );
        } catch (error) {
          console.error("Error fetching company details:", error);
        }
      }

      let consigneeDetails = null;
      try {
        const consigneeResponse = await axios.get(
          "http://localhost:5000/api/consignees"
        );
        consigneeDetails = consigneeResponse.data.find(
          (consignee) =>
            consignee.name.trim().toLowerCase() ===
            data.consignee.trim().toLowerCase()
        );
      } catch (error) {
        console.error("Error fetching consignee details:", error);
      }

      const addSectionTitle = (title, yPosition) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, 10, yPosition);
      };

      let yPosition = 25;

      addSectionTitle("Seller Details", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [["Seller Name", "Company", "GST No", "Address"]],
        body: [
          [
            sellerDetails?.sellerName || "N/A",
            sellerDetails?.companies.join(", ") || "N/A",
            companyDetails?.gstNo || "N/A",
            companyDetails?.address || "N/A",
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 10;
      addSectionTitle("PO Details", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [["Challan No", "Date", "GSTIN", "Buyer PO No"]],
        body: [
          [
            data.billNumber,
            new Date(data.loadingDate).toLocaleDateString(),
            companyDetails?.gstNo || "N/A",
            data.saudaNo || "N/A",
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 10;
      addSectionTitle("Delivery Address", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [["Consignee", "Address"]],
        body: [[data.consignee, consigneeDetails?.location || "N/A"]],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 10;
      addSectionTitle("Buyer Details", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [["Buyer Name", "Buyer Company"]],
        body: [
          [buyerDetails?.buyer || "N/A", buyerDetails?.buyerCompany || "N/A"],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 10;
      addSectionTitle("Goods Description", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [["Product", "Bags", "Weight (Tons)"]],
        body: [[data.commodity, data.bags || "N/A", data.loadingWeight]],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 10;
      addSectionTitle("Transport Details", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [["Lorry Number", "Transport", "Driver Name", "Driver Phone"]],
        body: [
          [
            data.lorryNumber,
            data.addedTransport,
            data.driverName,
            data.driverPhoneNumber,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 10;
      addSectionTitle("Freight Details", yPosition);
      doc.autoTable({
        startY: yPosition + 5,
        head: [
          ["Freight Rate", "Total Freight", "Advance Paid", "Balance Due"],
        ],
        body: [
          [
            `Rs. ${data.freightRate}`,
            `Rs. ${data.totalFreight}`,
            `Rs. ${data.advance}`,
            `Rs. ${data.totalFreight - data.advance}`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 102, 204] },
      });

      yPosition = doc.autoTable.previous.finalY + 20;
      addSectionTitle("Driver Signature", yPosition);
      doc.line(20, yPosition + 5, 120, yPosition + 5);

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This is a system-generated document and does not require a signature.",
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
