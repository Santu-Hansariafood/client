import { useState, useMemo } from "react";
import { FaFilePdf, FaCalendarAlt, FaBoxOpen } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const LoadingOverviewTable = ({ loadingEntries }) => {
  const [filterDate, setFilterDate] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("");

  const commodities = useMemo(() => {
    const set = new Set(loadingEntries.map((e) => e.commodity).filter(Boolean));
    return Array.from(set).sort();
  }, [loadingEntries]);

  const filteredData = useMemo(() => {
    return loadingEntries.filter((entry) => {
      const dateMatch =
        !filterDate || entry.loadingDate?.startsWith(filterDate);
      const commodityMatch =
        !filterCommodity || entry.commodity === filterCommodity;
      return dateMatch && commodityMatch;
    });
  }, [loadingEntries, filterDate, filterCommodity]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort(
      (a, b) => new Date(b.loadingDate) - new Date(a.loadingDate),
    );
  }, [filteredData]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Date",
      "Sauda No",
      "Lorry No",
      "Commodity",
      "Weight (T)",
      "Consignee",
      "Supplier",
      "Bill No",
    ];
    const tableRows = sortedData.map((entry) => [
      new Date(entry.loadingDate).toLocaleDateString("en-IN"),
      entry.saudaNo || "N/A",
      entry.lorryNumber,
      entry.commodity,
      entry.loadingWeight,
      entry.consignee,
      entry.supplierCompany,
      entry.billNumber || "N/A",
    ]);

    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105);
    doc.text("LOADING PERFORMANCE REPORT", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const reportInfo = `Report Period: ${filterDate || "All Time"} | Generated: ${new Date().toLocaleString("en-IN")}`;
    doc.text(reportInfo, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "striped",
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center" },
        4: { halign: "right" },
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
    });

    const totalWeight = sortedData.reduce(
      (sum, e) => sum + (Number(e.loadingWeight) || 0),
      0,
    );
    const finalY = doc.lastAutoTable.finalY || 40;

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(`Total Records: ${sortedData.length}`, 14, finalY + 10);
    doc.text(`Total Weight: ${totalWeight.toFixed(2)} Tons`, 14, finalY + 17);

    doc.save(`Loading_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="flex items-center gap-3 font-serif text-lg font-semibold text-lux-ink sm:text-xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30">
              <FaCalendarAlt />
            </span>
            Loading Performance Records
          </h2>
          <p className="mt-1 text-sm text-lux-muted">
            Detailed date-wise tracking of loading activities and performance.
          </p>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <button
            onClick={downloadPDF}
            disabled={!sortedData.length}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 sm:flex-none"
          >
            <FaFilePdf size={16} />
            Export PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 shadow-sm sm:p-5 md:grid-cols-3">
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Select Month
          </label>
          <input
            type="month"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full rounded-xl border border-[#e6dcc4] bg-lux-ivory px-4 py-2.5 text-sm text-lux-ink transition focus:border-lux-gold focus:outline-none focus:ring-2 focus:ring-lux-gold/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Commodity Type
          </label>
          <div className="relative">
            <select
              value={filterCommodity}
              onChange={(e) => setFilterCommodity(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#e6dcc4] bg-lux-ivory px-4 py-2.5 text-sm text-lux-ink transition focus:border-lux-gold focus:outline-none focus:ring-2 focus:ring-lux-gold/40"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FaBoxOpen className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lux-muted" />
          </div>
        </div>
        <div className="flex items-end">
          <div className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-100 p-2.5">
            <span className="text-xs font-bold uppercase text-emerald-700">
              Filtered Total:
            </span>
            <span className="font-serif text-lg font-black text-lux-emerald">
              {sortedData
                .reduce((sum, e) => sum + (Number(e.loadingWeight) || 0), 0)
                .toFixed(2)}{" "}
              <small className="text-[10px] font-bold">TONS</small>
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ece4d2] bg-lux-cream shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ece4d2] bg-lux-ivory">
                <th className="px-4 py-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-emerald sm:px-6">
                  Date
                </th>
                <th className="px-4 py-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-emerald sm:px-6">
                  Sauda / Lorry
                </th>
                <th className="px-4 py-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-emerald sm:px-6">
                  Commodity
                </th>
                <th className="px-4 py-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-emerald sm:px-6">
                  Weight
                </th>
                <th className="px-4 py-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-emerald sm:px-6">
                  Parties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece4d2]">
              {sortedData.slice(0, 10).map((entry, idx) => (
                <tr
                  key={entry._id || idx}
                  className="group transition-colors hover:bg-lux-ivory/70"
                >
                  <td className="px-4 py-4 sm:px-6">
                    <div className="font-serif text-sm font-bold text-lux-ink">
                      {new Date(entry.loadingDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                    <div className="text-[10px] font-medium text-lux-muted">
                      {new Date(entry.loadingDate).getFullYear()}
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="text-sm font-bold text-lux-ink transition-colors group-hover:text-lux-emerald">
                      {entry.lorryNumber}
                    </div>
                    <div className="text-[10px] font-bold text-lux-muted">
                      SAUDA: {entry.saudaNo}
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className="inline-flex rounded-full border border-[#e6dcc4] bg-lux-cream px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lux-emerald">
                      {entry.commodity}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="font-serif text-sm font-black text-lux-ink">
                      {entry.loadingWeight.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-lux-muted">
                      TONS
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="max-w-[150px] truncate text-xs font-bold text-lux-ink">
                      {entry.consignee}
                    </div>
                    <div className="text-[10px] italic text-lux-muted">
                      From: {entry.supplierCompany}
                    </div>
                  </td>
                </tr>
              ))}
              {!sortedData.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-lux-ivory p-4 text-lux-gold/70">
                        <FaBoxOpen size={40} />
                      </div>
                      <p className="font-medium text-lux-muted">
                        No loading records found for the selected filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedData.length > 10 && (
          <div className="border-t border-[#ece4d2] bg-lux-ivory p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-lux-muted">
              Displaying latest 10 of {sortedData.length} records
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverviewTable;
