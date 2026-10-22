import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import {
  FaTimes,
  FaPrint,
  FaCalendarAlt,
  FaBuilding,
  FaUserTie,
  FaBox,
  FaArrowDown,
  FaFilePdf,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../../utils/apiClient/apiClient";
import Loading from "../../../../common/Loading/Loading";
import logoImg from "../../../../assets/Hans.png";

const SaudaDetailPopup = ({ saudaNo, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/self-orders/details/${saudaNo}`);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching sauda details:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load sauda details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [saudaNo]);

  useEffect(() => {
    if (saudaNo) fetchDetails();
  }, [saudaNo, fetchDetails]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const consolidatedData = useMemo(() => {
    if (!data) return [];

    const items = [];
    let runningBalance = 0;

    (data.entries || []).forEach((entry) => {
      const weight = entry.unloadingWeight || entry.loadingWeight || 0;
      const rate = entry.actualRate || 0;
      const cd = entry.cd || 0;
      const gst = entry.gst || 0;

      const gross = weight * rate;
      const taxable = gross - (gross * cd) / 100;
      const amount = taxable + (taxable * gst) / 100;

      runningBalance += amount;

      items.push({
        type: "loading",
        date: entry.loadingDate,
        billNo: entry.billNumber || "-",
        lNo: entry.loadingNo || "-",
        lWt: entry.loadingWeight || 0,
        unDt: entry.unloadingDate
          ? new Date(entry.unloadingDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
            })
          : "-",
        unWt: entry.unloadingWeight || 0,
        amount: amount,
        balance: runningBalance,
        original: entry,
      });
    });

    (data.payments || []).forEach((payment) => {
      const saudaMappings = (payment.mappings || []).filter(
        (m) => m.saudaNo === saudaNo,
      );
      const allocatedAmount = saudaMappings.reduce(
        (sum, m) => sum + (m.allocatedAmount || 0),
        0,
      );

      if (allocatedAmount > 0) {
        runningBalance -= allocatedAmount;
        items.push({
          type: "payment",
          date: payment.date,
          mode: payment.paymentMode,
          remarks: payment.remarks,
          amount: allocatedAmount,
          balance: runningBalance,
          original: payment,
        });
      }
    });

    return items.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff === 0) {
        return a.type === "loading" ? -1 : 1;
      }
      return dateDiff;
    });
  }, [data, saudaNo]);

  const handlePrint = useCallback(() => {
    if (!data) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, 30, "F");

    try {
      doc.addImage(logoImg, "PNG", margin, 5, 20, 20);
    } catch (e) {
      console.error("Logo failed to load for PDF");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2 + 10, 15, {
      align: "center",
    });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106",
      pageWidth / 2 + 10,
      20,
      { align: "center" },
    );

    doc.setLineWidth(0.5);
    doc.line(margin, 28, pageWidth - margin, 28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`SAUDA MIS REPORT: ${saudaNo}`, margin, 35);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Generated on: ${new Date().toLocaleString("en-GB")}`,
      pageWidth - margin,
      35,
      { align: "right" },
    );

    doc.line(margin, 38, pageWidth - margin, 38);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Buyer : ${data.order?.buyerCompany?.toUpperCase() || "N/A"}`,
      margin,
      45,
    );
    doc.text(
      `Seller : ${(data.order?.supplier?.sellerName || data.order?.supplierCompany || "N/A").toUpperCase()}`,
      margin,
      50,
    );
    doc.text(
      `Consignee : ${(data.order?.consignee || "-").toUpperCase()}`,
      margin,
      55,
    );

    doc.text(
      `Sauda Dt. : ${data.order?.date ? new Date(data.order.date).toLocaleDateString("en-GB") : "N/A"}`,
      pageWidth - margin,
      45,
      { align: "right" },
    );
    doc.text(
      `Qty : ${data.order?.quantity?.toLocaleString() || "0"} ${data.order?.unit || "Ton"}`,
      pageWidth - margin,
      50,
      { align: "right" },
    );
    doc.text(
      `Rate : RS. ${data.order?.rate?.toLocaleString() || "0"}`,
      pageWidth - margin,
      55,
      { align: "right" },
    );

    const tableData = [];
    consolidatedData.forEach((item) => {
      if (item.type === "loading") {
        tableData.push([
          new Date(item.date).toLocaleDateString("en-GB"),
          item.billNo,
          item.lNo,
          item.lWt.toFixed(3),
          item.unDt,
          item.unWt.toFixed(3),
          `RS. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `RS. ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ]);
      } else {
        tableData.push([
          {
            content: `${new Date(item.date).toLocaleDateString("en-GB")} – PAYMENT RECEIVED RS. ${item.amount.toLocaleString()}/- BY ${item.mode.toUpperCase()}${item.remarks ? ` [${item.remarks.toUpperCase()}]` : ""}`,
            colSpan: 8,
            styles: {
              fontStyle: "bold",
              textColor: [0, 100, 0],
              fillColor: [240, 255, 240],
              fontSize: 7,
              halign: "left",
            },
          },
        ]);
        tableData.push([
          "",
          "",
          "",
          "",
          "",
          "",
          {
            content: `– RS. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: [150, 0, 0],
            },
          },
          {
            content:
              item.balance <= 1 && item.balance >= -1
                ? "NIL"
                : `RS. ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: [0, 0, 0],
            },
          },
        ]);
      }
    });

    autoTable(doc, {
      startY: 62,
      head: [
        [
          "Date",
          "Bill No.",
          "L.No.",
          "L.Wt",
          "Un.Dt",
          "Un.Wt",
          "Amount",
          "Balance",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 8,
        fontStyle: "bold",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        halign: "center",
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 15, halign: "center" },
        2: { cellWidth: 15, halign: "center" },
        3: { halign: "right" },
        4: { cellWidth: 15, halign: "center" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth - margin,
          doc.internal.pageSize.height - 10,
          { align: "right" },
        );
        doc.text(
          "This is a computer generated document.",
          margin,
          doc.internal.pageSize.height - 10,
        );
      },
    });

    doc.save(`Sauda_MIS_${saudaNo}.pdf`);
  }, [data, saudaNo, consolidatedData]);

  if (!saudaNo) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#062e25]/70 backdrop-blur-sm animate-modal-backdrop"
        onClick={handleBackdropClick}
      >
        <div className="bg-lux-cream w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-pop-in">
          <div className="p-4 sm:p-6 border-b border-[#ece4d2] flex items-center justify-between bg-lux-ivory">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-lux-emerald to-lux-deep rounded-2xl flex items-center justify-center text-lux-gold-soft shadow-lg">
                <FaFilePdf size={20} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-lux-ink tracking-tight">
                  Details of {saudaNo}
                </h3>
                <p className="lux-eyebrow">
                  Sauda MIS Report
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data && !loading && !error && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-gradient-to-br from-lux-emerald to-lux-deep hover:from-lux-deep hover:to-lux-night text-lux-gold-soft px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ring-1 ring-lux-gold/30"
                >
                  <FaPrint /> Export PDF
                </button>
              )}
              <button
                onClick={onClose}
                className="p-3 bg-lux-cream border border-[#e4dbc6] text-lux-muted hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 rounded-xl transition-all"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
            {loading ? (
              <Loading />
            ) : error ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                  <FaExclamationTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-semibold text-lux-ink">
                    Oops! Something went wrong
                  </h4>
                  <p className="text-sm text-lux-muted max-w-xs mx-auto">
                    {error}
                  </p>
                </div>
                <button
                  onClick={fetchDetails}
                  className="px-8 py-3 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft rounded-2xl text-xs font-black uppercase tracking-widest hover:from-lux-deep hover:to-lux-night transition-all shadow-xl"
                >
                  Try Again
                </button>
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 bg-lux-ivory p-6 rounded-3xl border border-[#ece4d2]">
                    <div className="flex items-center gap-3">
                      <FaBuilding className="text-lux-muted" />
                      <div>
                        <p className="lux-eyebrow">
                          Buyer
                        </p>
                        <p className="font-bold text-lux-ink uppercase">
                          {data.order?.buyerCompany || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaUserTie className="text-lux-muted" />
                      <div>
                        <p className="lux-eyebrow">
                          Seller
                        </p>
                        <p className="font-bold text-lux-ink uppercase">
                          {data.order?.supplier?.sellerName ||
                            data.order?.supplierCompany ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaArrowDown className="text-lux-muted" />
                      <div>
                        <p className="lux-eyebrow">
                          Consignee
                        </p>
                        <p className="font-bold text-lux-ink uppercase">
                          {data.order?.consignee || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-gradient-to-br from-lux-emerald via-lux-deep to-lux-emerald p-6 rounded-3xl text-lux-cream shadow-xl shadow-lux-emerald/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="lux-eyebrow text-lux-gold-soft/70">
                          Sauda Date
                        </p>
                        <p className="font-serif text-lg font-semibold tracking-tight">
                          {data.order?.date
                            ? new Date(data.order.date).toLocaleDateString(
                                "en-GB",
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <FaCalendarAlt className="text-lux-gold-soft/40" size={24} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="lux-eyebrow text-lux-gold-soft/70">
                          Quantity
                        </p>
                        <p className="font-serif text-lg font-semibold tracking-tight">
                          {data.order?.quantity?.toLocaleString() || "0"}{" "}
                          {data.order?.unit || "Ton"}
                        </p>
                      </div>
                      <FaBox className="text-lux-gold-soft/40" size={24} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="lux-eyebrow text-lux-gold-soft/70">
                          Rate
                        </p>
                        <p className="font-serif text-lg font-semibold tracking-tight">
                          Rs. {data.order?.rate?.toLocaleString() || "0"}
                        </p>
                      </div>
                      <FaChartLine className="text-lux-gold-soft/40" size={24} />
                    </div>
                  </div>
                </div>

                <div className="border border-[#ece4d2] rounded-3xl overflow-hidden shadow-sm bg-lux-cream">
                  {consolidatedData.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-gold-soft font-serif border-b border-[#ece4d2]">
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest">
                            Date
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest">
                            Bill No.
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest">
                            L.No.
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest text-right">
                            L.Wt
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest">
                            Un.Dt
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest text-right">
                            Un.Wt
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest text-right">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft tracking-widest text-right">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ece4d2]">
                        {consolidatedData.map((item, idx) => (
                          <React.Fragment key={idx}>
                            {item.type === "loading" ? (
                              <tr className="odd:bg-lux-cream even:bg-[#f2eee2]/50 hover:bg-lux-ivory transition-colors">
                                <td className="px-4 py-4 text-xs font-bold text-lux-muted">
                                  {new Date(item.date).toLocaleDateString(
                                    "en-GB",
                                  )}
                                </td>
                                <td className="px-4 py-4 text-xs font-black text-lux-ink">
                                  {item.billNo}
                                </td>
                                <td className="px-4 py-4 text-xs font-bold text-lux-muted">
                                  {item.lNo}
                                </td>
                                <td className="px-4 py-4 text-xs font-black text-lux-ink text-right">
                                  {item.lWt.toFixed(3)}
                                </td>
                                <td className="px-4 py-4 text-xs font-bold text-lux-muted">
                                  {item.unDt}
                                </td>
                                <td className="px-4 py-4 text-xs font-black text-lux-ink text-right">
                                  {item.unWt.toFixed(3)}
                                </td>
                                <td className="px-4 py-4 text-xs font-black text-lux-ink text-right italic">
                                  Rs.{" "}
                                  {item.amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-4 py-4 text-xs font-black text-lux-ink text-right italic">
                                  Rs.{" "}
                                  {item.balance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            ) : (
                              <tr className="bg-emerald-50/30">
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <p className="text-[11px] font-bold text-lux-muted italic">
                                      {new Date(item.date).toLocaleDateString(
                                        "en-GB",
                                      )}{" "}
                                      – Payment made Rs.{" "}
                                      {item.amount.toLocaleString()}/- by{" "}
                                      {item.mode}
                                      {item.remarks && (
                                        <span className="text-lux-muted/70 ml-1">
                                          [{item.remarks}]
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-black text-rose-500 text-right italic">
                                  – Rs. {item.amount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right italic">
                                  {item.balance <= 1 && item.balance >= -1
                                    ? "NIL"
                                    : `Rs. ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-16 h-16 bg-lux-ivory rounded-full flex items-center justify-center text-lux-gold">
                        <FaBox size={24} />
                      </div>
                      <p className="text-lux-muted font-bold uppercase tracking-widest">
                        No entries or payments found for this Sauda.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default SaudaDetailPopup;
