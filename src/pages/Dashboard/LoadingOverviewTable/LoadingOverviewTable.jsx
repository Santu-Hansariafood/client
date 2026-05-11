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
      const dateMatch = !filterDate || entry.loadingDate?.startsWith(filterDate);
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
      "Lorry No",
      "Commodity",
      "Weight (Tons)",
      "Consignee",
      "Supplier",
    ];
    const tableRows = sortedData.map((entry) => [
      new Date(entry.loadingDate).toLocaleDateString("en-IN"),
      entry.lorryNumber,
      entry.commodity,
      entry.loadingWeight,
      entry.consignee,
      entry.supplierCompany,
    ]);

    doc.setFontSize(18);
    doc.text("Loading Overview Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const reportInfo = `Generated on: ${new Date().toLocaleString("en-IN")}${
      filterDate ? ` | Filter Date: ${filterDate}` : ""
    }${filterCommodity ? ` | Commodity: ${filterCommodity}` : ""}`;
    doc.text(reportInfo, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8 },
    });

    doc.save(`Loading_Overview_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <FaCalendarAlt className="text-emerald-500" />
            Loading Records
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Recent loading activities grouped by date and commodity.
          </p>
        </div>

        <button
          onClick={downloadPDF}
          disabled={!sortedData.length}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaFilePdf />
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Filter by Month
          </label>
          <input
            type="month"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Filter by Commodity
          </label>
          <div className="relative">
            <select
              value={filterCommodity}
              onChange={(e) => setFilterCommodity(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FaBoxOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Lorry No
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Commodity
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Consignee
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.slice(0, 10).map((entry, idx) => (
              <tr
                key={entry._id || idx}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                  {new Date(entry.loadingDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">
                  {entry.lorryNumber}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold">
                    {entry.commodity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                  {entry.loadingWeight} T
                </td>
                <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[150px]">
                  {entry.consignee}
                </td>
              </tr>
            ))}
            {!sortedData.length && (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                  No loading records found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {sortedData.length > 10 && (
          <div className="p-3 bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200">
            Showing latest 10 of {sortedData.length} records
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverviewTable;
