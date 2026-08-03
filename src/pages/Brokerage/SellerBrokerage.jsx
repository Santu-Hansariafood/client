import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import api, { clearApiCache } from "../../utils/apiClient/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaDownload,
  FaTimes,
  FaHandshake,
  FaFilePdf,
  FaCheckCircle,
} from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import DataDropdown from "../../common/DataDropdown/DataDropdown";

const Tables = lazy(() => import("../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../common/Paginations/Paginations"));
const DateSelector = lazy(
  () => import("../../common/DateSelector/DateSelector"),
);

const API_URL = "/loading-entries/brokerage-report";
const BROKERAGE_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Paid" },
];

const SellerBrokerage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paidDate, setPaidDate] = useState(new Date());
  const [brokerageStatus, setBrokerageStatus] = useState(
    BROKERAGE_STATUS_OPTIONS[0],
  );
  const [exporting, setExporting] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const [sellerOptions, setSellerOptions] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchInput(searchInput);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        clearApiCache();
        const response = await api.get(`${API_URL}/filters`);
        setSellerOptions(response.data?.supplierCompanies || []);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchInput, startDate, endDate, selectedSeller, brokerageStatus]);

  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: "seller",
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplierCompany: selectedSeller?.value || undefined,
        brokerageStatus:
          brokerageStatus?.value && brokerageStatus.value !== "all"
            ? brokerageStatus.value
            : undefined,
      };

      const response = await api.get(API_URL, { params });
      const resData = response.data || {};

      setData(resData.data || []);
      setTotalItems(resData.total || 0);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch brokerage data");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchInput,
    startDate,
    endDate,
    selectedSeller,
    brokerageStatus,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setSelectedSeller(null);
    setBrokerageStatus(BROKERAGE_STATUS_OPTIONS[0]);
    setCurrentPage(1);
  };

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => item._id));
    }
  };

  const handleMarkPaid = useCallback(
    async (id = null) => {
      if (updatingPayment) return;

      const usingSelectedRows = !id && selectedIds.length > 0;
      const targetLabel = id
        ? "this entry"
        : usingSelectedRows
          ? `${selectedIds.length} selected entr${selectedIds.length === 1 ? "y" : "ies"}`
          : "all filtered entries";

      const confirmed = window.confirm(
        `Mark seller brokerage as paid for ${targetLabel}?`,
      );
      if (!confirmed) return;

      try {
        setUpdatingPayment(true);
        const response = await api.post(`${API_URL}/mark-paid`, {
          type: "seller",
          ids: id ? [id] : usingSelectedRows ? selectedIds : [],
          search: debouncedSearchInput?.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          supplierCompany: selectedSeller?.value || undefined,
          paidDate: paidDate ? new Date(paidDate).toISOString() : undefined,
        });

        const updatedCount = response.data?.modifiedCount || 0;
        toast.success(
          updatedCount > 0
            ? `${updatedCount} seller brokerage entr${updatedCount === 1 ? "y" : "ies"} marked paid`
            : "No pending seller brokerage entries found",
        );
        clearApiCache();
        setSelectedIds([]);
        fetchData();
      } catch (error) {
        console.error("Seller brokerage payment update error:", error);
        toast.error("Failed to update seller brokerage payment status");
      } finally {
        setUpdatingPayment(false);
      }
    },
    [
      updatingPayment,
      selectedIds,
      debouncedSearchInput,
      startDate,
      endDate,
      selectedSeller,
      paidDate,
      fetchData,
    ],
  );

  const handleDownloadExcel = useCallback(async () => {
    if (exporting) return;
    let toastId;
    try {
      setExporting(true);
      toastId = toast.loading("Preparing Seller Brokerage Excel...");

      const params = {
        type: "seller",
        search: searchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplierCompany: selectedSeller?.value || undefined,
        brokerageStatus:
          brokerageStatus?.value && brokerageStatus.value !== "all"
            ? brokerageStatus.value
            : undefined,
        ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
      };

      const response = await api.get(`${API_URL}/excel`, {
        params,
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SellerBrokerage_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch {
      if (toastId) toast.dismiss(toastId);
      toast.error("Failed to download Excel file");
    } finally {
      setExporting(false);
    }
  }, [
    searchInput,
    startDate,
    endDate,
    selectedSeller,
    selectedIds,
    exporting,
    brokerageStatus,
  ]);

  const handleDownloadPDF = useCallback(async () => {
    if (exporting) return;
    const toastId = toast.loading("Preparing Seller Brokerage PDF...");
    try {
      setExporting(true);

      const params = {
        type: "seller",
        search: searchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplierCompany: selectedSeller?.value || undefined,
        brokerageStatus:
          brokerageStatus?.value && brokerageStatus.value !== "all"
            ? brokerageStatus.value
            : undefined,
        ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
      };

      const response = await api.get(`${API_URL}/pdf`, {
        params,
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SellerBrokerage_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: "PDF downloaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.update(toastId, {
        render: "Failed to download PDF",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setExporting(false);
    }
  }, [
    searchInput,
    startDate,
    endDate,
    selectedSeller,
    selectedIds,
    exporting,
    brokerageStatus,
  ]);

  const handleDownloadSummaryExcel = useCallback(async () => {
    if (exporting) return;
    let toastId;
    try {
      setExporting(true);
      toastId = toast.loading("Preparing Seller Brokerage Summary Excel...");

      const params = {
        type: "seller",
        summary: true,
        search: searchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplierCompany: selectedSeller?.value || undefined,
        brokerageStatus:
          brokerageStatus?.value && brokerageStatus.value !== "all"
            ? brokerageStatus.value
            : undefined,
        ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
      };

      const response = await api.get(`${API_URL}/excel`, {
        params,
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SellerBrokerage_Summary_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Summary Excel downloaded successfully");
    } catch {
      if (toastId) toast.dismiss(toastId);
      toast.error("Failed to download summary Excel file");
    } finally {
      setExporting(false);
    }
  }, [
    searchInput,
    startDate,
    endDate,
    selectedSeller,
    selectedIds,
    exporting,
    brokerageStatus,
  ]);

  const handleDownloadSummaryPDF = useCallback(async () => {
    if (exporting) return;
    const toastId = toast.loading("Preparing Seller Brokerage Summary PDF...");
    try {
      setExporting(true);

      const params = {
        type: "seller",
        summary: true,
        search: searchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplierCompany: selectedSeller?.value || undefined,
        brokerageStatus:
          brokerageStatus?.value && brokerageStatus.value !== "all"
            ? brokerageStatus.value
            : undefined,
        ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
      };

      const response = await api.get(`${API_URL}/pdf`, {
        params,
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SellerBrokerage_Summary_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: "Summary PDF downloaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Summary PDF Export Error:", error);
      toast.update(toastId, {
        render: "Failed to download summary PDF",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setExporting(false);
    }
  }, [
    searchInput,
    startDate,
    endDate,
    selectedSeller,
    selectedIds,
    exporting,
    brokerageStatus,
  ]);

  const headers = [
    <input
      key="select-all"
      type="checkbox"
      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
      checked={data.length > 0 && selectedIds.length === data.length}
      onChange={handleSelectAll}
    />,
    "Sl No",
    "Loading Date",
    "Sauda No",
    "Bill No",
    "Lorry No",
    "Seller Name",
    "Buyer Company",
    "Commodity",
    "Loading Wt",
    "Unloading Wt",
    "Calculated Wt",
    "Brokerage / Ton",
    "Total Brokerage",
    "Status",
    "Paid Date",
    "Action",
  ];

  const rows = useMemo(
    () =>
      data.map((item, index) => {
        const slNo = (currentPage - 1) * itemsPerPage + index + 1;
        const formattedDate = item.loadingDate
          ? new Date(item.loadingDate).toLocaleDateString("en-GB")
          : "N/A";
        const formattedPaidDate = item.brokeragePaidDate
          ? new Date(item.brokeragePaidDate).toLocaleDateString("en-GB")
          : "---";
        const isPaid = item.brokerageStatus === "done";
        const calculatedWeight =
          item.calculatedWeight ||
          (item.unloadingWeight || item.unloadingWeight === 0
            ? item.unloadingWeight
            : item.loadingWeight);

        return [
          <input
            key={`select-${item._id}`}
            type="checkbox"
            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            checked={selectedIds.includes(item._id)}
            onChange={() => handleSelect(item._id)}
          />,
          <span key={`sl-${item._id}`} className="font-black text-slate-400">
            {slNo}
          </span>,
          <span
            key={`date-${item._id}`}
            className="font-bold text-slate-600 text-[11px]"
          >
            {formattedDate}
          </span>,
          <span
            key={`sauda-${item._id}`}
            className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 text-[11px]"
          >
            {item.saudaNo || "N/A"}
          </span>,
          <span
            key={`bill-${item._id}`}
            className="font-black text-slate-900 text-[11px] uppercase tracking-tighter"
          >
            {item.billNumber || "---"}
          </span>,
          <span
            key={`lorry-${item._id}`}
            className="font-bold text-slate-700 text-[11px]"
          >
            {item.lorryNumber || "N/A"}
          </span>,
          <span
            key={`seller-${item._id}`}
            className="font-bold text-slate-800 text-[11px]"
          >
            {item.sellerAccount || "N/A"}
          </span>,
          <span
            key={`buyer-${item._id}`}
            className="font-medium text-slate-600 text-[11px]"
          >
            {item.buyerCompany || "N/A"}
          </span>,
          <span
            key={`comm-${item._id}`}
            className="font-bold text-slate-700 text-[11px]"
          >
            {item.commodity || "N/A"}
          </span>,
          <span
            key={`lwt-${item._id}`}
            className="font-medium text-slate-600 text-[11px]"
          >
            {item.loadingWeight || 0} T
          </span>,
          <span
            key={`uwt-${item._id}`}
            className="font-black text-slate-900 text-[11px]"
          >
            {item.unloadingWeight || 0} T
          </span>,
          <span
            key={`cwt-${item._id}`}
            className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 text-[11px]"
          >
            {calculatedWeight || 0} T
          </span>,
          <span
            key={`brk-${item._id}`}
            className="font-bold text-orange-600 text-[11px]"
          >
            ₹{item.brokerageRate || 0} / T
          </span>,
          <span
            key={`total-${item._id}`}
            className="font-black text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 text-[11px]"
          >
            ₹{item.totalBrokerage?.toFixed(2) || "0.00"}
          </span>,
          <span
            key={`status-${item._id}`}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-green-50 text-green-700 border border-green-100"
            }`}
          >
            {isPaid ? "Paid" : "Pending"}
          </span>,
          <span
            key={`paid-date-${item._id}`}
            className="font-medium text-slate-600 text-[11px]"
          >
            {formattedPaidDate}
          </span>,
          isPaid ? (
            <span
              key={`action-${item._id}`}
              className="text-[11px] font-bold text-emerald-600"
            >
              Paid
            </span>
          ) : (
            <button
              key={`action-${item._id}`}
              type="button"
              onClick={() => handleMarkPaid(item._id)}
              disabled={updatingPayment}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaCheckCircle size={12} />
              Mark Paid
            </button>
          ),
        ];
      }),
    [data, currentPage, itemsPerPage, selectedIds, handleMarkPaid, updatingPayment],
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Seller Brokerage"
        subtitle="Manage and track seller-side brokerage records"
        icon={FaHandshake}
        noContentCard
      >
        <div className="relative min-h-screen overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 blur-[120px] rounded-full animate-pulse delay-700" />
          </div>

          <div className="max-w-full space-y-6 animate-fade-in-up">
            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 border border-white/60 shadow-2xl shadow-slate-200/50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-2xl bg-white text-slate-600 text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-orange-600 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-50"
                  >
                    <FaDownload size={14} />
                    <span>{exporting ? "Exporting..." : "Excel"}</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
                  >
                    <FaFilePdf size={14} />
                    <span>{exporting ? "Exporting..." : "PDF"}</span>
                  </button>
                  <button
                    onClick={handleDownloadSummaryExcel}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-600 text-white text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 active:scale-95 disabled:opacity-50"
                  >
                    <FaDownload size={14} />
                    <span>{exporting ? "Exporting..." : "Summary Excel"}</span>
                  </button>
                  <button
                    onClick={handleDownloadSummaryPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-95 disabled:opacity-50"
                  >
                    <FaFilePdf size={14} />
                    <span>{exporting ? "Exporting..." : "Summary PDF"}</span>
                  </button>
                  <div className="h-10 w-[1px] bg-slate-100 hidden sm:block mx-2" />
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-[200px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Select Seller Company
                      </span>
                      <DataDropdown
                        options={sellerOptions}
                        selectedOptions={selectedSeller}
                        onChange={setSelectedSeller}
                        placeholder="All Seller Companies"
                      />
                    </div>
                    <div className="flex flex-col min-w-[180px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Brokerage Status
                      </span>
                      <DataDropdown
                        options={BROKERAGE_STATUS_OPTIONS}
                        selectedOptions={brokerageStatus}
                        onChange={(option) =>
                          setBrokerageStatus(
                            option || BROKERAGE_STATUS_OPTIONS[0],
                          )
                        }
                        placeholder="All Status"
                        isClearable
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Start Date
                      </span>
                      <DateSelector
                        selectedDate={startDate}
                        onChange={setStartDate}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        End Date
                      </span>
                      <DateSelector
                        selectedDate={endDate}
                        onChange={setEndDate}
                      />
                    </div>
                    {(startDate ||
                      endDate ||
                      searchInput ||
                      selectedSeller ||
                      brokerageStatus?.value !== "all") && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-5 p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all shadow-sm"
                        title="Clear all filters"
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full lg:max-w-md">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <AiOutlineSearch
                        size={20}
                        className="text-slate-400 group-focus-within:text-orange-600 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by Sauda, Seller, Buyer, Lorry or Commodity..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 border border-white/60 shadow-2xl shadow-slate-200/50">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    Seller Brokerage Payment
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Mark one entry, selected entries, or the full filtered list as paid.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                      Paid Date
                    </span>
                    <DateSelector
                      selectedDate={paidDate}
                      onChange={(date) => setPaidDate(date || new Date())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkPaid()}
                    disabled={updatingPayment || loading || data.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaCheckCircle size={14} />
                    <span>
                      {updatingPayment
                        ? "Updating..."
                        : selectedIds.length > 0
                          ? `Mark ${selectedIds.length} Selected Paid`
                          : "Mark Filtered Paid"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-8 border border-white/60 shadow-2xl shadow-slate-200/50">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Synchronizing Data...
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-[1.5rem] overflow-hidden border border-slate-100">
                    <Tables headers={headers} rows={rows} />
                  </div>

                  {data.length === 0 && (
                    <div className="py-24 text-center flex flex-col items-center justify-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 shadow-inner">
                        <FaHandshake size={40} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                          No brokerage records found
                        </h3>
                        <p className="text-sm text-slate-400 font-medium">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                      <button
                        onClick={handleClearFilters}
                        className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}

                  <div className="mt-8 border-t border-slate-100 pt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
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

export default SellerBrokerage;
