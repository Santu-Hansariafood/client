import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";

import { downloadFile } from "../../../utils/fileDownloader";

const ViewBidPopup = ({ bidId, onClose }) => {
  const [bidDetails, setBidDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBidDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/bids/${bidId}`);
        setBidDetails(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        toast.error("Failed to fetch bid details");
      } finally {
        setLoading(false);
      }
    };

    if (bidId) fetchBidDetails();
  }, [bidId]);

  const generatePDF = async () => {
    if (!bidDetails) return;
    setIsGeneratingPDF(true);
    const toastId = toast.loading("Generating PDF...");

    try {
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
        ["Group", bidDetails.group || "N/A"],
        ["Consignee", bidDetails.consignee || "N/A"],
        ["Origin", bidDetails.origin || "N/A"],
        ["Commodity", bidDetails.commodity || "N/A"],
        ["Quantity", `${bidDetails.quantity || 0} TONS`],
        ["Rate", `Rs. ${bidDetails.rate || 0}`],
        ["Bid Date", bidDetails.bidDate ? new Date(bidDetails.bidDate).toLocaleDateString("en-GB") : "N/A"],
        ["Start Time", bidDetails.startTime || "N/A"],
        ["End Time", bidDetails.endTime || "N/A"],
        ["Payment Terms", `${bidDetails.paymentTerms || 0} Days`],
        ["Delivery", `${bidDetails.delivery || 0} Days`],
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

      if (bidDetails.parameters && Object.keys(bidDetails.parameters).length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Quality Parameters", 15, finalY);
        doc.setFont("helvetica", "normal");

        const parameterRows = Object.entries(bidDetails.parameters).map(
          ([key, value]) => [key, `${value}%`],
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
      }

      doc.setFont("helvetica", "bold");
      doc.text("Notes", 15, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(
        bidDetails.notes || "No additional notes provided.",
        15,
        finalY + 5,
      );

      finalY += 15;
      doc.line(15, finalY, 195, finalY);

      doc.setFontSize(10);
      doc.text(
        "Corporate Office: Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700098",
        105,
        finalY + 5,
        { align: "center" },
      );
      doc.text(
        "Registered Office: 207, Maharshi Debendranath Road, 6th Floor, Room No. 111, Kolkata - 700 007",
        105,
        finalY + 10,
        { align: "center" },
      );
      doc.text(
        "Contact: +91-93304 33535, +91-98304 33535 | Email: info@hansariafood.com | www.hansariafood.com",
        105,
        finalY + 15,
        { align: "center" },
      );
      doc.line(15, finalY + 18, 195, finalY + 18);

      const pdfBlob = doc.output("blob");
      await downloadFile(pdfBlob, `Bid_${bidDetails.group || "Details"}.pdf`);
      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
      toast.dismiss(toastId);
    }
  };

  if (!bidId) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/60 backdrop-blur-sm flex justify-center items-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-green-800 uppercase tracking-tight">
            {bidDetails?.type || "Bid"} Details
          </h2>
          <button
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl">✖</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="py-20">
              <Loading />
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 mb-4">
                {error}
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Go Back
              </button>
            </div>
          ) : bidDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="space-y-1">
                  <span className="text-gray-500 block">Group</span>
                  <span className="font-semibold text-gray-900">{bidDetails.group || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 block">Commodity</span>
                  <span className="font-semibold text-gray-900">{bidDetails.commodity || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 block">Origin</span>
                  <span className="font-semibold text-gray-900">{bidDetails.origin || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 block">Consignee</span>
                  <span className="font-semibold text-gray-900">{bidDetails.consignee || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 block">Quantity</span>
                  <span className="font-semibold text-gray-900">{bidDetails.quantity || 0} TONS</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 block">Rate</span>
                  <span className="font-semibold text-emerald-600 text-base">₹{bidDetails.rate || 0}</span>
                </div>
              </div>

              {/* Quality Parameters */}
              {bidDetails.parameters && Object.keys(bidDetails.parameters).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Quality Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(bidDetails.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-600 text-xs">{key}</span>
                        <span className="font-bold text-gray-900 text-xs">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time & Terms */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div className="p-3 rounded-xl border border-gray-100 bg-emerald-50/30">
                  <span className="text-gray-500 text-xs block mb-1">Bid Date</span>
                  <span className="font-medium">
                    {bidDetails.bidDate ? new Date(bidDetails.bidDate).toLocaleDateString("en-GB") : "N/A"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-emerald-50/30">
                  <span className="text-gray-500 text-xs block mb-1">Time Range</span>
                  <span className="font-medium">
                    {bidDetails.startTime || "00:00"} - {bidDetails.endTime || "00:00"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-blue-50/30">
                  <span className="text-gray-500 text-xs block mb-1">Payment Terms</span>
                  <span className="font-medium text-blue-700">{bidDetails.paymentTerms || 0} Days</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-blue-50/30">
                  <span className="text-gray-500 text-xs block mb-1">Delivery</span>
                  <span className="font-medium text-blue-700">{bidDetails.delivery || 0} Days</span>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-2">
                <span className="text-gray-500 text-xs block mb-1 uppercase font-bold tracking-wider">Notes</span>
                <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 italic">
                  {bidDetails.notes || "No additional notes provided."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {!loading && !error && bidDetails && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 shadow-lg shadow-green-200/50 ${
                isGeneratingPDF
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98]"
              }`}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">📄</span>
                  <span>Download PDF Report</span>
                </>
              )}
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
