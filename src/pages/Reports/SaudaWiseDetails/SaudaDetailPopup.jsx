import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "../../../utils/apiClient/apiClient";
import PopupBox from "../../../common/PopupBox/PopupBox";
import Loading from "../../../common/Loading/Loading";
import {
  FaFilePdf,
  FaPrint,
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";

const SaudaDetailPopup = ({ sauda, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [lorries, setLorries] = useState([]);
  const [payments, setPayments] = useState([]);
  const reportRef = useRef();

  const fetchData = useCallback(async () => {
    if (!sauda?.saudaNo) return;
    setLoading(true);
    try {
      const [lorriesRes, paymentsRes] = await Promise.all([
        api.get("/loading-entries", {
          params: { saudaNo: sauda.saudaNo, limit: 0 },
        }),
        api.get("/payment-received", {
          params: { saudaNo: sauda.saudaNo, limit: 0 },
        }),
      ]);

      const lorryData = Array.isArray(lorriesRes.data)
        ? lorriesRes.data
        : lorriesRes.data?.data || [];
      const paymentData = Array.isArray(paymentsRes.data)
        ? paymentsRes.data
        : paymentsRes.data?.data || [];

      setLorries(lorryData);
      setPayments(paymentData);
    } catch (error) {
      console.error("Error fetching detail data:", error);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [sauda]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateNetAmount = useCallback((lorry) => {
    const weight =
      (lorry.unloadingWeight || 0) > 0
        ? lorry.unloadingWeight
        : lorry.loadingWeight || 0;
    const rate = lorry.actualRate || 0;
    const cdPercent = lorry.cd || 0;
    const gstPercent = lorry.gst || 0;

    const grossAmount = weight * rate;
    const cdAmount = grossAmount * (cdPercent / 100);
    const taxableAmount = grossAmount - cdAmount;
    const gstAmount = taxableAmount * (gstPercent / 100);
    const netAmount = taxableAmount + gstAmount;

    return Math.round(netAmount);
  }, []);

  const paymentsByLorry = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      p.mappings?.forEach((m) => {
        if (m.loadingEntryId) {
          if (!map[m.loadingEntryId]) map[m.loadingEntryId] = [];
          if (
            !map[m.loadingEntryId].some((existing) => existing._id === p._id)
          ) {
            map[m.loadingEntryId].push(p);
          }
        }
      });
    });
    return map;
  }, [payments]);

  const getPaymentsForLorry = useCallback(
    (lorryId) => {
      return paymentsByLorry[lorryId] || [];
    },
    [paymentsByLorry],
  );

  const lorryDataWithCalculations = useMemo(() => {
    return lorries.map((lorry) => {
      const netAmount = calculateNetAmount(lorry);
      const lorryPayments = getPaymentsForLorry(lorry._id);
      const paidAmount = lorryPayments.reduce((sum, p) => {
        const mapping = p.mappings?.find((m) => m.loadingEntryId === lorry._id);
        return sum + (mapping?.allocatedAmount || 0);
      }, 0);
      const balance = netAmount - paidAmount;
      return { ...lorry, netAmount, lorryPayments, paidAmount, balance };
    });
  }, [lorries, calculateNetAmount, getPaymentsForLorry]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text("SAUDA WISE REPORT", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`HANSARIA FOOD PVT LTD`, pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(10);
    doc.rect(14, 28, pageWidth - 28, 25);
    doc.text(`Buyer: ${sauda.buyerCompany || "N/A"}`, 18, 35);
    doc.text(`Seller: ${sauda.sellerCompany || "N/A"}`, 18, 42);
    doc.text(`Consignee: ${lorries[0]?.consigneeName || "N/A"}`, 18, 49);

    doc.text(
      `Sauda Dt: ${new Date(sauda.createdAt).toLocaleDateString()}`,
      pageWidth - 70,
      35,
    );
    doc.text(
      `Qty: ${sauda.quantity || 0} ${sauda.unit || "Ton"}`,
      pageWidth - 70,
      42,
    );
    doc.text(`Rate: ${sauda.rate || 0}`, pageWidth - 70, 49);

    let currentY = 60;

    lorryDataWithCalculations.forEach((lorry, index) => {
      const { netAmount, balance, lorryPayments } = lorry;

      doc.autoTable({
        startY: currentY,
        head: [
          [
            "Date",
            "Bill No",
            "L. No",
            "R.Wt",
            "Un. Qty",
            "Un. Wt",
            "Amount",
            "Balance",
          ],
        ],
        body: [
          [
            new Date(lorry.loadingDate).toLocaleDateString(),
            lorry.billNo || "N/A",
            lorry.lorryNumber || "N/A",
            (lorry.loadingWeight || 0).toFixed(3),
            lorry.unloadingDate
              ? `${new Date(lorry.unloadingDate).getDate()}/${new Date(lorry.unloadingDate).getMonth() + 1}`
              : "N/A",
            (lorry.unloadingWeight || 0).toFixed(3),
            netAmount.toLocaleString(),
            balance.toLocaleString(),
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 8 },
      });

      currentY = doc.lastAutoTable.finalY + 5;

      if (lorryPayments.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Payment Details:", 14, currentY);
        currentY += 5;

        lorryPayments.forEach((p) => {
          const mapping = p.mappings?.find(
            (m) => m.loadingEntryId === lorry._id,
          );
          doc.setFont("helvetica", "normal");
          doc.text(
            `${new Date(p.date).toLocaleDateString()} - Payment made: Rs. ${mapping.allocatedAmount.toLocaleString()}/- via ${p.paymentMode} ${p.remarks ? `(${p.remarks})` : ""}`,
            18,
            currentY,
          );
          currentY += 5;
        });

        doc.setFont("helvetica", "bold");
        doc.text(
          `Balance: ${balance <= 0 ? "NIL" : `Rs. ${balance.toLocaleString()}/-`}`,
          14,
          currentY,
        );
        currentY += 10;
      } else {
        currentY += 5;
      }

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save(`Sauda_Report_${sauda.saudaNo}.pdf`);
  };

  return (
    <PopupBox
      title={`Details of Sauda: ${sauda.saudaNo}`}
      onClose={onClose}
      className="!max-w-6xl !w-[95vw]"
    >
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-6" ref={reportRef}>
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <FaFilePdf size={14} />
              Export PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
            >
              <FaPrint size={14} />
              Print
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Buyer
              </p>
              <p className="text-sm font-black text-slate-800">
                {sauda.buyerCompany || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Seller
              </p>
              <p className="text-sm font-black text-slate-800">
                {sauda.sellerCompany || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Consignee
              </p>
              <p className="text-sm font-black text-slate-800">
                {lorries[0]?.consigneeName || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Sauda Date
              </p>
              <p className="text-sm font-black text-slate-800">
                {new Date(sauda.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Quantity
              </p>
              <p className="text-sm font-black text-slate-800">
                {sauda.quantity || 0} {sauda.unit || "Ton"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Rate
              </p>
              <p className="text-sm font-black text-emerald-600">
                Rs. {sauda.rate || 0}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {lorryDataWithCalculations.length > 0 ? (
              lorryDataWithCalculations.map((lorry, idx) => {
                const { netAmount, balance, lorryPayments } = lorry;

                return (
                  <div
                    key={lorry._id}
                    className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm"
                  >
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                          Lorry: {lorry.lorryNumber}
                        </h5>
                      </div>
                      {balance <= 0 ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                          <FaCheckCircle /> Fully Paid
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">
                          <FaTimesCircle /> Pending: Rs.{" "}
                          {balance.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white">
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                              Date
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                              Bill No
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                              L. No
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">
                              R.Wt
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">
                              Un. Qty
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">
                              Un. Wt
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white group">
                            <td className="px-6 py-4 text-[11px] font-bold text-slate-600">
                              {new Date(lorry.loadingDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-black text-slate-800">
                              {lorry.billNo || "-"}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-black text-emerald-600">
                              {lorry.lorryNumber}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-bold text-slate-600 text-center">
                              {(lorry.loadingWeight || 0).toFixed(3)}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-bold text-slate-600 text-center">
                              {lorry.unloadingDate
                                ? `${new Date(lorry.unloadingDate).getDate()}/${new Date(lorry.unloadingDate).getMonth() + 1}`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-bold text-slate-600 text-center">
                              {(lorry.unloadingWeight || 0).toFixed(3)}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-black text-slate-900 text-right">
                              Rs. {netAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-black text-slate-900 text-right bg-slate-50/50">
                              Rs. {balance.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {lorryPayments.length > 0 && (
                      <div className="bg-slate-50/30 p-6 border-t border-slate-50 space-y-4">
                        <div className="flex items-center gap-2">
                          <FaHistory className="text-slate-300" size={12} />
                          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Payment History for this Lorry
                          </h6>
                        </div>
                        <div className="space-y-3">
                          {lorryPayments.map((p, pIdx) => {
                            const mapping = p.mappings?.find(
                              (m) => m.loadingEntryId === lorry._id,
                            );
                            return (
                              <div
                                key={p._id}
                                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm gap-3"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-800">
                                      {new Date(p.date).toLocaleDateString()} —
                                      Payment made:{" "}
                                      <span className="text-emerald-600">
                                        Rs.{" "}
                                        {mapping?.allocatedAmount?.toLocaleString() ||
                                          0}
                                        /-
                                      </span>
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-500 italic">
                                      via {p.paymentMode}{" "}
                                      {p.remarks ? `· ${p.remarks}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="pt-4 flex justify-end border-t border-slate-100">
                          <p className="text-sm font-black text-slate-800">
                            Final Balance:{" "}
                            <span
                              className={
                                balance <= 0
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }
                            >
                              {balance <= 0
                                ? "NIL"
                                : `Rs. ${balance.toLocaleString()}/-`}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">
                  No lorry entries found for this Sauda.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .popup-content, .popup-content * { visibility: visible; }
          .popup-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `,
        }}
      />
    </PopupBox>
  );
};

export default SaudaDetailPopup;
