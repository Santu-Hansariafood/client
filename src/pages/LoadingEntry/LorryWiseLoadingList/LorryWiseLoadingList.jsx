import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { toast } from "react-toastify";
import {
  FaFilePdf,
  FaTruck,
  FaSearch,
  FaDownload,
  FaFilter,
} from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../../../assets/Hans.png";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));

/**
 * LorryWiseLoadingList Component
 * Displays a premium table of loading entries with vehicle-wise reporting and PDF generation.
 */
const LorryWiseLoadingList = () => {
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLorry, setSearchLorry] = useState("");
  const [selectedStatus, setSelectedStatus] = useState({
    value: "all",
    label: "All Status",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "transit", label: "In Transit" },
    { value: "received", label: "Received" },
  ];

  const fetchLoadingEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        lorryNumber: searchLorry,
        status: selectedStatus.value,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await api.get("/loading-entries/lorry-wise", { params });
      const data = response.data?.data || [];

      setLoadingEntries(data);
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch loading entries", error);
      toast.error("Failed to load loading records");
    } finally {
      setLoading(false);
    }
  }, [searchLorry, selectedStatus, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchLoadingEntries();
  }, [fetchLoadingEntries]);

  const downloadSinglePDF = async (entry) => {
    const toastId = toast.loading(`Generating PDF for ${entry.lorryNumber}...`);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      try {
        doc.addImage(logoUrl, "PNG", pageWidth - 45, 10, 30, 30);
      } catch (e) {
        /* empty */
      }

      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("LORRY LOADING SLIP", 14, 25);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, pageWidth - 14, 35);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 42);

      const tableColumn = ["Field", "Details"];
      const tableRows = [
        ["Lorry Number", entry.lorryNumber],
        ["Loading Date", new Date(entry.loadingDate).toLocaleDateString("en-IN")],
        ["Sauda Number", entry.saudaNo],
        ["Commodity", entry.commodity],
        ["Bags", entry.bags || "N/A"],
        ["Loading Weight", `${Number(entry.loadingWeight || 0).toFixed(2)} Tons`],
        ["Unloading Weight", entry.unloadingWeight > 0 ? `${Number(entry.unloadingWeight).toFixed(2)} Tons` : "Not Unloaded"],
        ["Driver Name", entry.driverName || "N/A"],
        ["Driver Mobile", entry.driverPhoneNumber || "N/A"],
        ["Freight Rate", entry.freightRate ? `Rs. ${entry.freightRate}` : "N/A"],
        ["Supplier", entry.supplierCompany || "N/A"],
        ["Consignee", entry.consignee || "N/A"],
        ["Status", entry.unloadingWeight > 0 || entry.unloadingDate ? "RECEIVED" : "IN TRANSIT"],
      ];

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 50 },
          1: { cellWidth: "auto" },
        },
      });

      doc.save(`Loading_Slip_${entry.lorryNumber}_${entry.saudaNo}.pdf`);
      toast.update(toastId, { render: "PDF Downloaded", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      console.error("Single PDF generation failed", error);
      toast.update(toastId, { render: "Download Failed", type: "error", isLoading: false, autoClose: 2000 });
    }
  };

  const headers = [
    "Sl No",
    "Loading Date",
    "Lorry No",
    "Sauda No",
    "Commodity",
    "L. Weight (T)",
    "U. Weight (T)",
    "Status",
    "Action",
  ];

  const rows = loadingEntries.map((entry, index) => {
    const isReceived = entry.unloadingWeight > 0 || entry.unloadingDate;
    return [
      (currentPage - 1) * itemsPerPage + index + 1,
      new Date(entry.loadingDate).toLocaleDateString("en-IN"),
      <span key={`lorry-${index}`} className="font-black text-slate-900 tracking-tight">
        {entry.lorryNumber}
      </span>,
      <span key={`sauda-${index}`} className="font-bold text-slate-500">{entry.saudaNo}</span>,
      entry.commodity,
      <span key={`lweight-${index}`} className="font-bold text-indigo-600">
        {Number(entry.loadingWeight || 0).toFixed(2)}
      </span>,
      <span
        key={`uweight-${index}`}
        className={entry.unloadingWeight > 0 ? "font-bold text-emerald-600" : "text-slate-400"}
      >
        {entry.unloadingWeight > 0 ? Number(entry.unloadingWeight).toFixed(2) : "-"}
      </span>,
      <span
        key={`status-${index}`}
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          isReceived
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : "bg-amber-100 text-amber-700 border border-amber-200"
        }`}
      >
        {isReceived ? "Received" : "In Transit"}
      </span>,
      <div key={`actions-${index}`} className="flex items-center gap-2">
        <button
          onClick={() => downloadSinglePDF(entry)}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all shadow-sm border border-emerald-100"
          title="Download Slip"
        >
          <FaFilePdf size={14} />
        </button>
      </div>,
    ];
  });

  const downloadPDF = async () => {
    if (loadingEntries.length === 0) {
      toast.info("No records to download");
      return;
    }

    const toastId = toast.loading("Fetching all records and generating report...");
    try {
      // Fetch ALL matching records for the report, not just the current page
      const params = {
        lorryNumber: searchLorry,
        status: selectedStatus.value,
        page: 1,
        limit: 10000, // Large limit to get all records
      };

      const response = await api.get("/loading-entries/lorry-wise", { params });
      const allEntries = response.data?.data || [];
      const totalMatched = response.data?.total || allEntries.length;

      if (allEntries.length === 0) {
        toast.update(toastId, { render: "No records found to download", type: "info", isLoading: false, autoClose: 3000 });
        return;
      }

      const doc = new jsPDF("landscape");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Helper for header on each page
      const drawHeader = (data) => {
        try {
          doc.addImage(logoUrl, "PNG", pageWidth - 45, 10, 30, 30);
        } catch (e) { /* empty */ }

        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("LORRY WISE LOADING REPORT", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 32);
        
        // Show filter info and total matches
        let filterText = `Status: ${selectedStatus.label} | Total Matched: ${totalMatched} Records`;
        if (searchLorry) filterText = `Lorry: ${searchLorry} | ${filterText}`;
        doc.text(filterText, 14, 38);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 42, pageWidth - 14, 42);
      };

      const tableColumn = [
        "Sl No", "Date", "Lorry No", "Sauda No", "Commodity",
        "Bags", "L. Weight", "U. Weight", "Status", "Consignee", "Supplier"
      ];

      const tableRows = allEntries.map((entry, index) => [
        index + 1,
        new Date(entry.loadingDate).toLocaleDateString("en-IN"),
        entry.lorryNumber,
        entry.saudaNo,
        entry.commodity,
        entry.bags || "-",
        entry.loadingWeight,
        entry.unloadingWeight || "-",
        entry.unloadingWeight > 0 || entry.unloadingDate ? "Received" : "In Transit",
        entry.consignee,
        entry.supplierCompany,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontSize: 9,
          halign: "center",
          fontStyle: 'bold'
        },
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          2: { fontStyle: 'bold' },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "center" },
        },
        // This ensures the header is drawn if the table spans multiple pages
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );

          // We don't call drawHeader here because startY handles first page 
          // and autoTable doesn't natively re-run startY logic on new pages.
          // Instead, we let autoTable repeat headers (default behavior).
        },
        // Re-draw the company info/title if it's the first page
        willDrawPage: (data) => {
          if (data.pageNumber === 1) {
            drawHeader();
          }
        }
      });

      doc.save(`Lorry_Full_Report_${searchLorry || "All"}_${new Date().getTime()}.pdf`);
      toast.update(toastId, {
        render: `Report Downloaded (${totalMatched} records)`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.update(toastId, {
        render: "Failed to generate report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <AdminPageShell
      title="Lorry wise Loading Entry"
      subtitle="Comprehensive vehicle loading history and tracking"
      icon={FaTruck}
    >
      <div className="space-y-10">
        {/* Premium Filter Section */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/30">
          <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 ml-2">
                Vehicle Number
              </label>
              <Suspense fallback={<div className="h-14 bg-slate-100 animate-pulse rounded-2xl" />}>
                <SearchBox
                  placeholder="Search Lorry No..."
                  value={searchLorry}
                  onSearch={(q) => { setSearchLorry(q); setCurrentPage(1); }}
                  returnQuery={true}
                  items={[]}
                  className="!max-w-none !h-14 !rounded-2xl !border-slate-200 shadow-inner"
                />
              </Suspense>
            </div>

            <div className="w-full lg:w-72">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 ml-2">
                Filter by Status
              </label>
              <Suspense fallback={<div className="h-14 bg-slate-100 animate-pulse rounded-2xl" />}>
                <DataDropdown
                  options={statusOptions}
                  value={selectedStatus}
                  selectedOptions={selectedStatus}
                  onChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
                  placeholder="Select Status"
                  className="!mb-0"
                />
              </Suspense>
            </div>

            <button
              onClick={downloadPDF}
              disabled={loading || loadingEntries.length === 0}
              className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              <FaFilePdf className="text-lg" /> Download All ({loadingEntries.length})
            </button>
          </div>
        </div>

        {/* Premium Table Section */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">
              Loading Records
            </h3>
            <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
              Total Found: {totalItems}
            </span>
          </div>
          
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} loading={loading} />
          </Suspense>

          {loadingEntries.length === 0 && !loading && (
            <div className="py-24 text-center">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTruck className="text-3xl text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records matching your filters</p>
            </div>
          )}

          <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100">
            <Suspense fallback={<div className="h-12" />}>
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default LorryWiseLoadingList;
