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
import getBrokerageSummaryFilename from "../../utils/brokerageReportFilename";

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
        getBrokerageSummaryFilename(selectedSeller?.value, "seller", "xlsx"),
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
        getBrokerageSummaryFilename(selectedSeller?.value, "seller", "pdf"),
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
      className="rounded border-[#d8cfb8] text-lux-emerald focus:ring-lux-gold/40"
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
            className="rounded border-[#d8cfb8] text-lux-emerald focus:ring-lux-gold/40"
            checked={selectedIds.includes(item._id)}
            onChange={() => handleSelect(item._id)}
          />,
          <span key={`sl-${item._id}`} className="font-black text-lux-muted">
            {slNo}
          </span>,
          <span
            key={`date-${item._id}`}
            className="text-[11px] font-bold text-lux-muted"
          >
            {formattedDate}
          </span>,
          <span
            key={`sauda-${item._id}`}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700"
          >
            {item.saudaNo || "N/A"}
          </span>,
          <span
            key={`bill-${item._id}`}
            className="text-[11px] font-black uppercase tracking-tighter text-lux-ink"
          >
            {item.billNumber || "---"}
          </span>,
          <span
            key={`lorry-${item._id}`}
            className="text-[11px] font-bold text-lux-ink"
          >
            {item.lorryNumber || "N/A"}
          </span>,
          <span
            key={`seller-${item._id}`}
            className="text-[11px] font-bold text-lux-ink"
          >
            {item.sellerAccount || "N/A"}
          </span>,
          <span
            key={`buyer-${item._id}`}
            className="text-[11px] font-medium text-lux-muted"
          >
            {item.buyerCompany || "N/A"}
          </span>,
          <span
            key={`comm-${item._id}`}
            className="text-[11px] font-bold text-lux-ink"
          >
            {item.commodity || "N/A"}
          </span>,
          <span
            key={`lwt-${item._id}`}
            className="text-[11px] font-medium text-lux-muted"
          >
            {item.loadingWeight || 0} T
          </span>,
          <span
            key={`uwt-${item._id}`}
            className="text-[11px] font-black text-lux-ink"
          >
            {item.unloadingWeight || 0} T
          </span>,
          <span
            key={`cwt-${item._id}`}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
          >
            {calculatedWeight || 0} T
          </span>,
          <span
            key={`brk-${item._id}`}
            className="text-[11px] font-bold text-lux-emerald"
          >
            ₹{item.brokerageRate || 0} / T
          </span>,
          <span
            key={`total-${item._id}`}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700"
          >
            ₹{item.totalBrokerage?.toFixed(2) || "0.00"}
          </span>,
          <span
            key={`status-${item._id}`}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              isPaid
                ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"
            }`}
          >
            {isPaid ? "Paid" : "Pending"}
          </span>,
          <span
            key={`paid-date-${item._id}`}
            className="text-[11px] font-medium text-lux-muted"
          >
            {formattedPaidDate}
          </span>,
          isPaid ? (
            <span
              key={`action-${item._id}`}
              className="text-[11px] font-bold text-lux-emerald"
            >
              Paid
            </span>
          ) : (
            <button
              key={`action-${item._id}`}
              type="button"
              onClick={() => handleMarkPaid(item._id)}
              disabled={updatingPayment}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-3 py-2 text-[10px] font-black uppercase tracking-wider text-lux-gold-soft shadow-sm ring-1 ring-lux-gold/30 transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
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
        <div className="relative min-h-screen overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-full space-y-6 animate-fade-in-up">
            <div className="lux-card lux-gold-top p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(-1)}
                    className="rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-95"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                  >
                    <FaDownload size={14} />
                    <span>{exporting ? "Exporting..." : "Excel"}</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                  >
                    <FaFilePdf size={14} />
                    <span>{exporting ? "Exporting..." : "PDF"}</span>
                  </button>
                  <button
                    onClick={handleDownloadSummaryExcel}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                  >
                    <FaDownload size={14} />
                    <span>{exporting ? "Exporting..." : "Summary Excel"}</span>
                  </button>
                  <button
                    onClick={handleDownloadSummaryPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                  >
                    <FaFilePdf size={14} />
                    <span>{exporting ? "Exporting..." : "Summary PDF"}</span>
                  </button>
                  <div className="mx-2 hidden h-10 w-[1px] bg-[#ece4d2] sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-[200px]">
                      <span className="lux-eyebrow mb-1 ml-1">
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
                      <span className="lux-eyebrow mb-1 ml-1">
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
                      <span className="lux-eyebrow mb-1 ml-1">
                        Start Date
                      </span>
                      <DateSelector
                        selectedDate={startDate}
                        onChange={setStartDate}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="lux-eyebrow mb-1 ml-1">
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
                        className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-500 shadow-sm transition-all hover:bg-rose-100"
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
                        className="text-lux-muted transition-colors group-focus-within:text-lux-emerald"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by Sauda, Seller, Buyer, Lorry or Commodity..."
                      className="w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream py-3 pl-11 pr-4 text-sm font-medium text-lux-ink placeholder-lux-muted transition-all focus:border-lux-emerald focus:outline-none focus:ring-4 focus:ring-lux-gold/20"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lux-card lux-gold-top p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-black tracking-tight text-lux-ink">
                    Seller Brokerage Payment
                  </h3>
                  <p className="text-sm font-medium text-lux-muted">
                    Mark one entry, selected entries, or the full filtered list as paid.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex flex-col">
                    <span className="lux-eyebrow mb-1 ml-1">
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
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep px-6 py-3 text-xs font-black uppercase tracking-widest text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
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

            <div className="lux-card p-4 sm:p-6 lg:p-8">
              {loading ? (
                <Loading />
              ) : (
                <>
                  <div className="overflow-hidden rounded-2xl border border-[#ece4d2]">
                    <Tables headers={headers} rows={rows} />
                  </div>

                  {data.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-[#ece4d2] bg-lux-ivory text-lux-gold-soft shadow-inner">
                        <FaHandshake size={40} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-xl font-black tracking-tight text-lux-ink">
                          No brokerage records found
                        </h3>
                        <p className="text-sm font-medium text-lux-muted">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                      <button
                        onClick={handleClearFilters}
                        className="rounded-xl border border-[#e4dbc6] bg-lux-cream px-6 py-2.5 text-xs font-black uppercase tracking-widest text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-95"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}

                  <div className="mt-8 border-t border-[#ece4d2] pt-8">
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
