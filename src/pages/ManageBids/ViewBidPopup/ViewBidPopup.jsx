import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Loading from "../../../common/Loading/Loading";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ViewBidPopup = ({ bidId, onClose }) => {
  const [bidDetails, setBidDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBidDetails = async () => {
      try {
        const response = await fetch(
          `https://phpserver-kappa.vercel.app/api/bids/${bidId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch bid details.");
        }
        const data = await response.json();
        setBidDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (bidId) fetchBidDetails();
  }, [bidId]);

  const generatePDF = () => {
    if (!bidDetails) return;

    const doc = new jsPDF({ format: "a4" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(208, 177, 19);
    doc.setFontSize(32);
    doc.text("Hansaria Food Private Limited", 105, 20, { align: "center" });

    doc.setTextColor(0, 128, 0);
    doc.setFontSize(10);
    doc.text("_______________________Broker & Commission Agent", 105, 28, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);
    doc.line(15, 38, 195, 38);

    doc.setFontSize(14);
    doc.text("Bid Details Report", 105, 48, { align: "center" });

    const tableColumn = ["Field", "Value"];
    const tableRows = [
      ["Group", bidDetails.group],
      ["Consignee", bidDetails.consignee],
      ["Origin", bidDetails.origin],
      ["Commodity", bidDetails.commodity],
      ["Quantity", `${bidDetails.quantity} TONS`],
      ["Rate", `Rs. ${bidDetails.rate}`],
      ["Bid Date", new Date(bidDetails.bidDate).toLocaleDateString("en-GB")],
      ["Start Time", bidDetails.startTime],
      ["End Time", bidDetails.endTime],
      ["Payment Terms", `${bidDetails.paymentTerms} Days`],
      ["Delivery", `${bidDetails.delivery} Days`],
    ];

    doc.autoTable({
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Quality Parameters", 15, finalY);
    doc.setFont("helvetica", "normal");

    const parameterRows = Object.entries(bidDetails.parameters).map(
      ([key, value]) => [key, `${value}%`]
    );

    doc.autoTable({
      startY: finalY + 5,
      head: [["Parameter", "Value"]],
      body: parameterRows,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    finalY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Notes", 15, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(
      bidDetails.notes || "No additional notes provided.",
      15,
      finalY + 5
    );

    finalY += 15;
    doc.line(15, finalY, 195, finalY);

    doc.setFontSize(10);
    doc.text(
      "Corporate Office: Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700098",
      105,
      finalY + 5,
      { align: "center" }
    );
    doc.text(
      "Registered Office: 207, Maharshi Debendranath Road, 6th Floor, Room No. 111, Kolkata - 700 007",
      105,
      finalY + 10,
      { align: "center" }
    );
    doc.text(
      "Contact: +91-93304 33535, +91-98304 33535 | Email: info@hansariafood.com | www.hansariafood.com",
      105,
      finalY + 15,
      { align: "center" }
    );
    doc.line(15, finalY + 18, 195, finalY + 18);

    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bid_${bidDetails.group}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!bidId) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
          onClick={onClose}
        >
          ✖
        </button>
        {loading ? (
          <Loading />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4 text-center text-green-700 uppercase">
              {bidDetails.type} Bid Details
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Group:</strong> {bidDetails.group}
              </p>
              <p>
                <strong>Consignee:</strong> {bidDetails.consignee}
              </p>
              <p>
                <strong>Origin:</strong> {bidDetails.origin}
              </p>
              <p>
                <strong>Commodity:</strong> {bidDetails.commodity}
              </p>
              <div>
                <strong>Quality Parameters:</strong>
                <ul className="list-disc list-inside border-dotted border-b-2 pb-2 mt-1">
                  {Object.entries(bidDetails.parameters).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value}%
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                <strong>Quantity:</strong> {bidDetails.quantity} TONS
              </p>
              <p>
                <strong>Rate:</strong> ₹{bidDetails.rate}
              </p>
              <p>
                <strong>Bid Date:</strong>{" "}
                {new Date(bidDetails.bidDate).toLocaleDateString("en-GB")}
              </p>
              <p>
                <strong>Start Time:</strong> {bidDetails.startTime}
              </p>
              <p>
                <strong>End Time:</strong> {bidDetails.endTime}
              </p>
              <p>
                <strong>Payment Terms:</strong> {bidDetails.paymentTerms}{" "}
                <strong> Days</strong>
              </p>
              <p>
                <strong>Delivery:</strong> {bidDetails.delivery}{" "}
                <strong> Days</strong>
              </p>
              <p>
                <strong>Notes: - </strong> {bidDetails.notes}
              </p>
            </div>
            <button
              onClick={generatePDF}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ViewBidPopup.propTypes = {
  bidId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ViewBidPopup;
