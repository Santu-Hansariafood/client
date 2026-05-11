import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import { FaFilePdf, FaCalendarAlt, FaBoxOpen, FaTruckLoading, FaHistory } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DateSelector = lazy(() => import("../../../common/DateSelector/DateSelector"));
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const DataDropdown = lazy(() => import("../../../common/DataDropdown/DataDropdown"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));

const LoadingReport = () => {
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLoadingEntries = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
      const params = {
        date: dateStr,
        commodity: selectedCommodity?.value || "",
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await api.get("/loading-entries", { params });
      const data = response.data?.data || response.data || [];
      const total = response.data?.total || data.length;

      setLoadingEntries(data);
      setTotalItems(total);
    } catch (error) {
      console.error("Failed to fetch loading entries", error);
      toast.error("Failed to load loading records");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedCommodity, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchLoadingEntries();
  }, [fetchLoadingEntries]);

  const commodityOptions = useMemo(() => {
    const commodities = Array.from(new Set(loadingEntries.map(e => e.commodity).filter(Boolean)));
    return commodities.map(c => ({ value: c, label: c }));
  }, [loadingEntries]);

  const summaryData = useMemo(() => {
    const totalWeight = loadingEntries.reduce((sum, e) => sum + (Number(e.loadingWeight) || 0), 0);
    const totalBags = loadingEntries.reduce((sum, e) => sum + (Number(e.bags) || 0), 0);
    const distinctLorry = new Set(loadingEntries.map(e => e.lorryNumber)).size;

    return {
      totalWeight,
      totalBags,
      totalEntries: loadingEntries.length,
      distinctLorry
    };
  }, [loadingEntries]);

  const headers = [
    "Sl No",
    "Time",
    "Sauda No",
    "Lorry No",
    "Commodity",
    "Weight (Tons)",
    "Bags",
    "Consignee",
    "Supplier"
  ];

  const rows = loadingEntries.map((entry, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }),
    entry.saudaNo,
    entry.lorryNumber,
    <span key={`comm-${index}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 uppercase">
      {entry.commodity}
    </span>,
    <span key={`weight-${index}`} className="font-bold text-emerald-600">
      {entry.loadingWeight?.toFixed(2)}
    </span>,
    entry.bags || "N/A",
    <div key={`con-${index}`} className="max-w-[150px] truncate text-xs font-medium">
      {entry.consignee}
    </div>,
    <div key={`sup-${index}`} className="max-w-[150px] truncate text-xs text-slate-500 italic">
      {entry.supplierCompany}
    </div>
  ]);

  const downloadPDF = async () => {
    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading("Generating PDF report...");

      // Fetch all entries for the selected date (no pagination limit)
      const dateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
      const params = {
        date: dateStr,
        commodity: selectedCommodity?.value || "",
        limit: 1000, // Large limit to get all records for the day
      };

      const response = await api.get("/loading-entries", { params });
      const allEntries = response.data?.data || response.data || [];

      if (allEntries.length === 0) {
        toast.dismiss(toastId);
        toast.info("No records found for the selected date.");
        return;
      }

      const doc = new jsPDF("landscape");
      const displayDate = selectedDate ? selectedDate.toLocaleDateString("en-IN") : "All Dates";
      
      doc.setFontSize(22);
      doc.setTextColor(5, 150, 105);
      doc.text("LOADING PERFORMANCE REPORT", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Report Date: ${displayDate}`, 14, 28);
      doc.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 14, 33);

      // Recalculate summary for all entries
      const fullWeight = allEntries.reduce((sum, e) => sum + (Number(e.loadingWeight) || 0), 0);
      const fullBags = allEntries.reduce((sum, e) => sum + (Number(e.bags) || 0), 0);
      const fullLorry = new Set(allEntries.map(e => e.lorryNumber)).size;

      // Summary Section in PDF
      doc.setDrawColor(200);
      doc.setFillColor(245, 250, 245);
      doc.rect(14, 38, 270, 20, 'FD');
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.text(`TOTAL WEIGHT: ${fullWeight.toFixed(2)} TONS`, 20, 50);
      doc.text(`TOTAL BAGS: ${fullBags}`, 100, 50);
      doc.text(`TOTAL VEHICLES: ${fullLorry}`, 180, 50);
      doc.text(`TOTAL ENTRIES: ${allEntries.length}`, 250, 50);

      const tableColumn = ["Sl No", "Time", "Sauda No", "Lorry No", "Commodity", "Weight (T)", "Bags", "Consignee", "Supplier"];
      const tableRows = allEntries.map((entry, index) => [
        index + 1,
        new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }),
        entry.saudaNo,
        entry.lorryNumber,
        entry.commodity,
        entry.loadingWeight?.toFixed(2),
        entry.bags || "-",
        entry.consignee,
        entry.supplierCompany
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          5: { halign: 'right', fontStyle: 'bold' },
          6: { halign: 'center' }
        }
      });

      doc.save(`Loading_Report_${displayDate.replace(/\//g, '-')}.pdf`);
      toast.dismiss(toastId);
      toast.success("PDF Report generated successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      if (toastId) toast.dismiss(toastId);
      toast.error("Failed to generate PDF report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Date-wise Loading Report"
        subtitle="Analyze loading performance and download detailed records by date"
        icon={FaHistory}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Controls Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Select Date
                </label>
                <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
              </div>

              <div className="md:col-span-1">
                <DataDropdown
                  label="Filter Commodity"
                  options={commodityOptions}
                  selectedOptions={selectedCommodity}
                  onChange={setSelectedCommodity}
                  isClearable
                  placeholder="All Commodities"
                />
              </div>

              <div className="lg:col-span-2 flex justify-end gap-3">
                <button
                  onClick={downloadPDF}
                  disabled={!loadingEntries.length}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <FaFilePdf size={18} />
                  Download Date Report
                </button>
                <button
                  onClick={fetchLoadingEntries}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                  title="Refresh Data"
                >
                  <FaTruckLoading size={20} className={loading ? "animate-bounce" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Dashboard at Top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20">
              <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Weight</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black">{summaryData.totalWeight.toFixed(2)}</h3>
                <span className="text-xs font-bold mb-1 opacity-80">TONS</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Bags</p>
              <h3 className="text-2xl font-black">{summaryData.totalBags}</h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg shadow-amber-500/20">
              <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest mb-1">Vehicles Loaded</p>
              <h3 className="text-2xl font-black">{summaryData.distinctLorry}</h3>
            </div>
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl p-5 text-white shadow-lg shadow-slate-500/20">
              <p className="text-slate-200 text-[10px] font-bold uppercase tracking-widest mb-1">Total Entries</p>
              <h3 className="text-2xl font-black">{summaryData.totalEntries}</h3>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaCalendarAlt className="text-emerald-500" />
                Loading Records for {selectedDate ? selectedDate.toLocaleDateString("en-IN") : "All Dates"}
              </h3>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="py-20"><Loading /></div>
              ) : (
                <>
                  <Tables headers={headers} rows={rows} />
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default LoadingReport;
