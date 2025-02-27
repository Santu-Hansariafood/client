import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";

const PrintLoadingEntry = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF();

      // Fetch seller details based on supplier ID
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

      // Header Section
      doc.setFontSize(36);
      doc.setTextColor(255, 204, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Hansaria Food Private Limited", 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(255, 0, 0);
      doc.text(`Bill No: ${data.billNumber}`, 10, 25);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("LORRY CHALLAN", 105, 30, { align: "center" });

      doc.line(10, 35, 200, 35);
      doc.line(10, 37, 200, 37);

      // Seller Details Section
      if (sellerDetails) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Seller Details", 105, 45, { align: "center" });

        const sellerTable = [
          ["Seller Name", sellerDetails.sellerName],
          [
            "Phone Number",
            sellerDetails.phoneNumbers.map((p) => p.value).join(", "),
          ],
          ["Email", sellerDetails.emails.map((e) => e.value).join(", ")],
          [
            "Commodities",
            sellerDetails.commodities
              .map((c) => `${c.name} (Rs. ${c.brokerage})`)
              .join(", "),
          ],
          ["Company", sellerDetails.companies.join(", ")],
        ];

        doc.autoTable({
          startY: 50,
          head: [["Field", "Details"]],
          body: sellerTable,
          theme: "grid",
        });
      } else {
        doc.text("Seller details not available.", 10, 50);
      }

      // Loading Entry Details
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Loading Details", 105, doc.autoTable.previous.finalY + 10, {
        align: "center",
      });

      const tableColumn = ["Field", "Details"];
      const tableRows = [
        ["Loading Date", new Date(data.loadingDate).toLocaleString()],
        ["Lorry Number", data.lorryNumber],
        ["Added Transport", data.addedTransport],
        ["Driver Name", data.driverName],
        ["Driver Phone", data.driverPhoneNumber],
        ["Freight Rate", `Rs. ${data.freightRate}`],
        ["Loading Weight", `${data.loadingWeight} TONS`],
        ["Total Freight", `Rs. ${data.totalFreight}`],
        ["Sauda No", data.saudaNo],
        ["Consignee", data.consignee],
        ["Commodity", data.commodity],
      ];

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 10,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
      });

      // Freight Calculation
      //   doc.setFontSize(14);
      //   doc.setFont("helvetica", "bold");
      //   doc.text("Freight Calculation", 105, doc.autoTable.previous.finalY + 10, { align: "center" });

      //   doc.autoTable({
      //     startY: doc.autoTable.previous.finalY + 15,
      //     head: [["Calculation", "Amount (Rs)"]],
      //     body: [
      //       [`${data.loadingWeight} X ${data.freightRate}`, `Rs. ${data.loadingWeight * data.freightRate}`],
      //     ],
      //     theme: "grid",
      //   });

      // Payment Details
      doc.setFontSize(14);
      doc.text("Payment Details", 105, doc.autoTable.previous.finalY + 10, {
        align: "center",
      });

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 15,
        head: [["Description", "Amount (Rs)"]],
        body: [
          ["Total Freight", `Rs. ${data.totalFreight}`],
          ["Advance Paid", `Rs. ${data.advance}`],
          ["Balance Due", `Rs. ${data.totalFreight - data.advance}`],
        ],
        theme: "striped",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(
        "This is a System Generated Document – No Signature Required.",
        105,
        doc.autoTable.previous.finalY + 15,
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
