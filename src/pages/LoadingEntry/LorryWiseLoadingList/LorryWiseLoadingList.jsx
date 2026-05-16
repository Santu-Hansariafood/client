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
  FaFilter,
  FaDownload,
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
        [
          "Loading Date",
          new Date(entry.loadingDate).toLocaleDateString("en-IN"),
        ],
        ["Sauda Number", entry.saudaNo],
        ["Commodity", entry.commodity],
        ["Bags", entry.bags || "N/A"],
        [
          "Loading Weight",
          `${Number(entry.loadingWeight || 0).toFixed(2)} Tons`,
        ],
        [
          "Unloading Weight",
          entry.unloadingWeight > 0
            ? `${Number(entry.unloadingWeight).toFixed(2)} Tons`
            : "Not Unloaded",
        ],
        ["Driver Name", entry.driverName || "N/A"],
        ["Driver Mobile", entry.driverPhoneNumber || "N/A"],
        ["Freight Rate", entry.freightRate ? `₹${entry.freightRate}` : "N/A"],
        ["Supplier", entry.supplierCompany || "N/A"],
        ["Consignee", entry.consignee || "N/A"],
        [
          "Status",
          entry.unloadingWeight > 0 || entry.unloadingDate
            ? "RECEIVED"
            : "IN TRANSIT",
        ],
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
      toast.update(toastId, {
        render: "PDF Downloaded",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Single PDF generation failed", error);
      toast.update(toastId, {
        render: "Download Failed",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
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
      <span key={`lorry-${index}`} className="font-bold text-slate-700">
        {entry.lorryNumber}
      </span>,
      entry.saudaNo,
      entry.commodity,
      <span key={`lweight-${index}`} className="font-bold text-indigo-600">
        {Number(entry.loadingWeight || 0).toFixed(2)}
      </span>,
      <span
        key={`uweight-${index}`}
        className={
          entry.unloadingWeight > 0
            ? "font-bold text-emerald-600"
            : "text-slate-400"
        }
      >
        {entry.unloadingWeight > 0
          ? Number(entry.unloadingWeight).toFixed(2)
          : "-"}
      </span>,
      <span
        key={`status-${index}`}
        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition shadow-sm"
          title="Download PDF"
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

    const toastId = toast.loading("Generating Lorry Wise Report...");
    try {
      const doc = new jsPDF("landscape");
      const pageWidth = doc.internal.pageSize.getWidth();

      try {
        doc.addImage(logoUrl, "PNG", pageWidth - 45, 10, 30, 30);
      } catch (e) {
        /* empty */
      }

      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.text("LORRY WISE LOADING REPORT", 14, 25);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 32);
      if (searchLorry) doc.text(`Filter - Lorry: ${searchLorry}`, 14, 37);
      doc.text(`Filter - Status: ${selectedStatus.label}`, 14, 42);

      const tableColumn = [
        "Sl No",
        "Date",
        "Lorry No",
        "Sauda No",
        "Commodity",
        "Bags",
        "L. Weight",
        "U. Weight",
        "Status",
        "Consignee",
        "Driver",
        "Freight",
      ];

      const tableRows = loadingEntries.map((entry, index) => [
        index + 1,
        new Date(entry.loadingDate).toLocaleDateString("en-IN"),
        entry.lorryNumber,
        entry.saudaNo,
        entry.commodity,
        entry.bags || "-",
        entry.loadingWeight,
        entry.unloadingWeight || "-",
        entry.unloadingWeight > 0 || entry.unloadingDate
          ? "Received"
          : "In Transit",
        entry.consignee,
        entry.driverName || "-",
        entry.freightRate || "-",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontSize: 8,
          halign: "center",
        },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          5: { halign: "center" },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "center" },
          11: { halign: "right" },
        },
      });

      doc.save(
        `Lorry_Report_${searchLorry || "All"}_${new Date().getTime()}.pdf`,
      );
      toast.update(toastId, {
        render: "Report Downloaded Successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("PDF generation failed", error);
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
      subtitle="Detailed report of loading entries by lorry number and status"
      icon={FaTruck}
    >
      <div className="space-y-6">
        {/* Filters Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Search Lorry Number
              </label>
              <Suspense fallback={<div className="h-12 bg-slate-100 animate-pulse rounded-xl" />}>
                <SearchBox
                  placeholder="Ex: WB 23 A 1234"
                  value={searchLorry}
                  onSearch={(q) => setSearchLorry(q)}
                  returnQuery={true}
                  items={[]}
                />
              </Suspense>
            </div>

            <div className="w-full md:w-64">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Lorry Status
              </label>
              <Suspense fallback={<div className="h-12 bg-slate-100 animate-pulse rounded-xl" />}>
                <DataDropdown
                  options={statusOptions}
                  value={selectedStatus}
                  selectedOptions={selectedStatus}
                  onChange={setSelectedStatus}
                  placeholder="Select Status"
                />
              </Suspense>
            </div>

            <button
              onClick={downloadPDF}
              disabled={loading || loadingEntries.length === 0}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
            >
              <FaFilePdf /> Download Report
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} loading={loading} />
          </Suspense>

          <div className="p-6 border-t border-slate-100">
            <Suspense fallback={<div className="h-10" />}>
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
