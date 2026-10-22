import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

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
        [
          "Bid Date",
          bidDetails.bidDate
            ? new Date(bidDetails.bidDate).toLocaleDateString("en-GB")
            : "N/A",
        ],
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

      if (
        bidDetails.parameters &&
        Object.keys(bidDetails.parameters).length > 0
      ) {
        doc.setFont("helvetica", "bold");
        doc.text("Quality Parameters", 15, finalY);
        doc.setFont("helvetica", "normal");

        const parameterRows = Object.entries(bidDetails.parameters).flatMap(
          ([key, vals]) => {
            const rows = [];
            if (vals?.baseValue) {
              rows.push([`${key} (Base)`, vals.baseValue]);
            }
            if (vals?.maxValue) {
              rows.push([`${key} (Max)`, vals.maxValue]);
            }
            return rows;
          },
        );

        if (parameterRows.length > 0) {
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

      await downloadFile(doc, `Bid_${bidDetails.group || "Details"}.pdf`);
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
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
      <div className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#ece4d2] bg-lux-cream/95 px-6 py-4 backdrop-blur-xl">
          <h2 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink sm:text-lg md:text-xl">
            {bidDetails?.type || "Bid"} Details
          </h2>
          <button
            className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lux-muted transition-all duration-300 hover:scale-105 hover:bg-[#f2eee2] hover:text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl">✖</span>
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="py-10 text-center">
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                {error}
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                Go Back
              </button>
            </div>
          ) : bidDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-1">
                  <span className="lux-eyebrow block">Group</span>
                  <span className="font-semibold text-lux-ink">
                    {bidDetails.group || "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="lux-eyebrow block">Commodity</span>
                  <span className="font-semibold text-lux-ink">
                    {bidDetails.commodity || "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="lux-eyebrow block">Origin</span>
                  <span className="font-semibold text-lux-ink">
                    {bidDetails.origin || "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="lux-eyebrow block">Consignee</span>
                  <span className="font-semibold text-lux-ink">
                    {bidDetails.consignee || "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="lux-eyebrow block">Quantity</span>
                  <span className="font-semibold text-lux-ink">
                    {bidDetails.quantity || 0} TONS
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="lux-eyebrow block">Rate</span>
                  <span className="font-serif text-base font-semibold text-lux-emerald">
                    ₹{bidDetails.rate || 0}
                  </span>
                </div>
              </div>

              {bidDetails.parameters &&
                Object.keys(bidDetails.parameters).length > 0 && (
                  <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4">
                    <h3 className="lux-eyebrow mb-3">
                      Quality Parameters
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(bidDetails.parameters).map(
                        ([key, vals]) => (
                          <div
                            key={key}
                            className="rounded-2xl border border-[#ece4d2] bg-lux-cream p-3"
                          >
                            <span className="mb-2 block text-xs font-semibold text-lux-muted">
                              {key}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {vals?.baseValue && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-lux-muted">
                                    Base
                                  </span>
                                  <span className="text-xs font-bold text-lux-ink">
                                    {vals.baseValue}
                                  </span>
                                </div>
                              )}
                              {vals?.maxValue && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-lux-muted">
                                    Max
                                  </span>
                                  <span className="text-xs font-bold text-lux-ink">
                                    {vals.maxValue}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-3">
                  <span className="lux-eyebrow mb-1 block">
                    Bid Date
                  </span>
                  <span className="font-medium text-lux-ink">
                    {bidDetails.bidDate
                      ? new Date(bidDetails.bidDate).toLocaleDateString("en-GB")
                      : "N/A"}
                  </span>
                </div>
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-3">
                  <span className="lux-eyebrow mb-1 block">
                    Time Range
                  </span>
                  <span className="font-medium text-lux-ink">
                    {bidDetails.startTime || "00:00"} -{" "}
                    {bidDetails.endTime || "00:00"}
                  </span>
                </div>
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-3">
                  <span className="lux-eyebrow mb-1 block">
                    Payment Terms
                  </span>
                  <span className="font-medium text-lux-emerald">
                    {bidDetails.paymentTerms || 0} Days
                  </span>
                </div>
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-3">
                  <span className="lux-eyebrow mb-1 block">
                    Delivery
                  </span>
                  <span className="font-medium text-lux-emerald">
                    {bidDetails.delivery || 0} Days
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-2">
                <span className="lux-eyebrow mb-1 block">
                  Notes
                </span>
                <p className="rounded-2xl border border-dashed border-[#e4dbc6] bg-lux-ivory p-3 text-sm italic text-lux-muted">
                  {bidDetails.notes || "No additional notes provided."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {!loading && !error && bidDetails && (
          <div className="border-t border-[#ece4d2] bg-lux-ivory/60 p-6">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-lux-gold-soft shadow-lg transition-all duration-300 ${
                isGeneratingPDF
                  ? "cursor-not-allowed bg-lux-muted"
                  : "bg-gradient-to-br from-lux-emerald to-lux-deep ring-1 ring-lux-gold/30 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              }`}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
