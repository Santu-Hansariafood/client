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
  FaChevronDown,
  FaChevronUp,
  FaHistory,
  FaWeightHanging,
  FaBox,
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
 * LorryGroupCard Component
 * Renders a premium card for a single lorry with its loading history
 */
const LorryGroupCard = ({ lorryNo, entries, onDownloadSingle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = useMemo(() => {
    const totalWeight = entries.reduce((sum, e) => sum + (Number(e.loadingWeight) || 0), 0);
    const totalBags = entries.reduce((sum, e) => sum + (Number(e.bags) || 0), 0);
    const lastTrip = entries[0]?.loadingDate;
    const isAnyInTransit = entries.some(e => !(e.unloadingWeight > 0 || e.unloadingDate));
    
    return { totalWeight, totalBags, tripCount: entries.length, lastTrip, isAnyInTransit };
  }, [entries]);

  const headers = [
    "Date", "Sauda No", "Commodity", "L. Weight (T)", "U. Weight (T)", "Status", "Action"
  ];

  const rows = entries.map((entry, index) => {
    const isReceived = entry.unloadingWeight > 0 || entry.unloadingDate;
    return [
      new Date(entry.loadingDate).toLocaleDateString("en-IN"),
      <span key={`sauda-${index}`} className="font-bold text-slate-600">{entry.saudaNo}</span>,
      entry.commodity,
      <span key={`lw-${index}`} className="font-bold text-indigo-600">{Number(entry.loadingWeight || 0).toFixed(2)}</span>,
      <span key={`uw-${index}`} className={entry.unloadingWeight > 0 ? "font-bold text-emerald-600" : "text-slate-400"}>
        {entry.unloadingWeight > 0 ? Number(entry.unloadingWeight).toFixed(2) : "-"}
      </span>,
      <span
        key={`st-${index}`}
        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
          isReceived ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {isReceived ? "Received" : "In Transit"}
      </span>,
      <button
        key={`act-${index}`}
        onClick={(e) => { e.stopPropagation(); onDownloadSingle(entry); }}
        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
        title="Download Slip"
      >
        <FaFilePdf size={12} />
      </button>
    ];
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/40 group">
      {/* Card Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 sm:p-8 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="h-16 w-14 sm:w-16 flex items-center justify-center rounded-3xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
            <FaTruck className="text-2xl text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {lorryNo}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`h-2 w-2 rounded-full ${stats.isAnyInTransit ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stats.isAnyInTransit ? 'Active Trips' : 'All Received'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-12">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Load</p>
            <div className="flex items-center gap-2">
              <FaWeightHanging className="text-indigo-500 text-xs" />
              <p className="text-sm sm:text-base font-black text-slate-800">{stats.totalWeight.toFixed(2)} T</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Bags</p>
            <div className="flex items-center gap-2">
              <FaBox className="text-emerald-500 text-xs" />
              <p className="text-sm sm:text-base font-black text-slate-800">{stats.totalBags}</p>
            </div>
          </div>
          <div className="space-y-1 hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trips</p>
            <div className="flex items-center gap-2">
              <FaHistory className="text-amber-500 text-xs" />
              <p className="text-sm sm:text-base font-black text-slate-800">{stats.tripCount} Entries</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] border-t border-slate-100' : 'max-h-0'}`}>
        <div className="p-4 sm:p-8 bg-slate-50/50">
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

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
        limit: 1000, // Get more for grouping
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
  }, [searchLorry, selectedStatus, currentPage]);

  useEffect(() => {
    fetchLoadingEntries();
  }, [fetchLoadingEntries]);

  // Group entries by lorry number
  const groupedLorryData = useMemo(() => {
    const groups = {};
    loadingEntries.forEach(entry => {
      const key = entry.lorryNumber?.toUpperCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [loadingEntries]);

  const downloadSinglePDF = async (entry) => {
    const toastId = toast.loading(`Generating PDF for ${entry.lorryNumber}...`);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      try {
        doc.addImage(logoUrl, "PNG", pageWidth - 45, 10, 30, 30);
      } catch (e) { /* empty */ }

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
        ["Status", (entry.unloadingWeight > 0 || entry.unloadingDate) ? "RECEIVED" : "IN TRANSIT"],
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

  const downloadPDF = async () => {
    if (loadingEntries.length === 0) {
      toast.info("No records to download");
      return;
    }

    const toastId = toast.loading("Generating Grouped Lorry Report...");
    try {
      const doc = new jsPDF("landscape");
      const pageWidth = doc.internal.pageSize.getWidth();

      try {
        doc.addImage(logoUrl, "PNG", pageWidth - 45, 10, 30, 30);
      } catch (e) { /* empty */ }

      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("LORRY WISE CONSOLIDATED REPORT", 14, 25);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 32);
      
      let currentY = 45;

      Object.entries(groupedLorryData).forEach(([lorryNo, entries], index) => {
        // Lorry Header in PDF
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(`Lorry: ${lorryNo} (${entries.length} Trips)`, 14, currentY);
        currentY += 5;

        const tableColumn = [
          "Date", "Sauda No", "Commodity", "Bags", "L. Weight", "U. Weight", "Status", "Consignee"
        ];

        const tableRows = entries.map(entry => [
          new Date(entry.loadingDate).toLocaleDateString("en-IN"),
          entry.saudaNo,
          entry.commodity,
          entry.bags || "-",
          entry.loadingWeight,
          entry.unloadingWeight || "-",
          (entry.unloadingWeight > 0 || entry.unloadingDate) ? "Received" : "In Transit",
          entry.consignee
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY,
          theme: "grid",
          headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 2 },
          margin: { bottom: 20 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
        
        // Add new page if needed
        if (currentY > 180 && index < Object.entries(groupedLorryData).length - 1) {
          doc.addPage();
          currentY = 20;
        }
      });

      doc.save(`Lorry_Consolidated_Report_${new Date().getTime()}.pdf`);
      toast.update(toastId, { render: "Report Downloaded", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.update(toastId, { render: "Failed to generate report", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <AdminPageShell
      title="Lorry wise Loading Entry"
      subtitle="Grouped loading history and performance metrics per vehicle"
      icon={FaTruck}
    >
      <div className="space-y-10">
        {/* Filters Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/30">
          <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 ml-2">
                Search Lorry Number
              </label>
              <Suspense fallback={<div className="h-14 bg-slate-100 animate-pulse rounded-2xl" />}>
                <SearchBox
                  placeholder="Enter Lorry No (Ex: WB 23...)"
                  value={searchLorry}
                  onSearch={(q) => setSearchLorry(q)}
                  returnQuery={true}
                  items={[]}
                  className="!max-w-none !h-14 !rounded-2xl !border-slate-200 shadow-inner"
                />
              </Suspense>
            </div>

            <div className="w-full lg:w-72">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 ml-2">
                Trip Status
              </label>
              <Suspense fallback={<div className="h-14 bg-slate-100 animate-pulse rounded-2xl" />}>
                <DataDropdown
                  options={statusOptions}
                  value={selectedStatus}
                  selectedOptions={selectedStatus}
                  onChange={setSelectedStatus}
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
              <FaFilePdf className="text-lg" /> Consolidated Report
            </button>
          </div>
        </div>

        {/* Grouped Content */}
        {loading ? (
          <Loading />
        ) : Object.keys(groupedLorryData).length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Found {Object.keys(groupedLorryData).length} Unique Vehicles
              </p>
            </div>
            
            {Object.entries(groupedLorryData).map(([lorryNo, entries]) => (
              <LorryGroupCard 
                key={lorryNo} 
                lorryNo={lorryNo} 
                entries={entries} 
                onDownloadSingle={downloadSinglePDF}
              />
            ))}

            <div className="pt-8">
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
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-300">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTruck className="text-3xl text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Vehicles Found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
};

export default LorryWiseLoadingList;
