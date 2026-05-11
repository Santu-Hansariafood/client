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
        halign: "center"
      },
      columnStyles: {
        0: { halign: "center" },
        4: { halign: "right" },
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
    });

    const totalWeight = sortedData.reduce((sum, e) => sum + (Number(e.loadingWeight) || 0), 0);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FaCalendarAlt className="text-emerald-600" />
            </div>
            Loading Performance Records
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Detailed date-wise tracking of loading activities and performance.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={downloadPDF}
            disabled={!sortedData.length}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaFilePdf size={16} />
            Export PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
            Select Month
          </label>
          <input
            type="month"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
            Commodity Type
          </label>
          <div className="relative">
            <select
              value={filterCommodity}
              onChange={(e) => setFilterCommodity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FaBoxOpen className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-end">
          <div className="w-full p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
             <span className="text-xs font-bold text-emerald-700 uppercase">Filtered Total:</span>
             <span className="text-lg font-black text-emerald-800">
               {sortedData.reduce((sum, e) => sum + (Number(e.loadingWeight) || 0), 0).toFixed(2)} <small className="text-[10px] font-bold">TONS</small>
             </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Sauda / Lorry
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Commodity
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Weight
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Parties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.slice(0, 10).map((entry, idx) => (
                <tr
                  key={entry._id || idx}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(entry.loadingDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {new Date(entry.loadingDate).getFullYear()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {entry.lorryNumber}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      SAUDA: {entry.saudaNo}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100">
                      {entry.commodity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-900">
                      {entry.loadingWeight.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">TONS</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                      {entry.consignee}
                    </div>
                    <div className="text-[10px] text-slate-400 italic">
                      From: {entry.supplierCompany}
                    </div>
                  </td>
                </tr>
              ))}
              {!sortedData.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <FaBoxOpen size={40} />
                      </div>
                      <p className="text-slate-400 font-medium">No loading records found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedData.length > 10 && (
          <div className="p-4 bg-slate-50 text-center border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Displaying latest 10 of {sortedData.length} records
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverviewTable;
