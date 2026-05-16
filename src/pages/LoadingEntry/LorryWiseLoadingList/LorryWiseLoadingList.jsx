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
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await api.get("/loading-entries", { params });
      let data = response.data?.data || response.data || [];

      // Client side status filtering since backend might not support it directly yet
      if (selectedStatus.value !== "all") {
        data = data.filter((entry) => {
          const isReceived = entry.unloadingWeight > 0 || entry.unloadingDate;
          return selectedStatus.value === "received" ? isReceived : !isReceived;
        });
      }

      setLoadingEntries(data);
      setTotalItems(response.data?.total || data.length);
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

  const headers = [
    "Sl No",
    "Loading Date",
    "Lorry No",
    "Sauda No",
    "Commodity",
    "L. Weight (T)",
    "U. Weight (T)",
    "Status",
    "Consignee",
    "Supplier",
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
      <div key={`con-${index}`} className="max-w-[120px] truncate text-xs">
        {entry.consignee}
      </div>,
      <div
        key={`sup-${index}`}
        className="max-w-[120px] truncate text-xs italic text-slate-500"
      >
        {entry.supplierCompany}
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
      icon={<FaTruck className="text-emerald-500" />}
    >
      <div className="space-y-6">
        {/* Filters Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Search Lorry Number
              </label>
              <SearchBox
                placeholder="Ex: WB 23 A 1234"
                value={searchLorry}
                onChange={(e) => setSearchLorry(e.target.value)}
                icon={<FaSearch className="text-slate-400" />}
              />
            </div>

            <div className="w-full md:w-64">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Lorry Status
              </label>
              <DataDropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Select Status"
              />
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
