import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import api from "../../utils/apiClient/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaDownload, FaTimes, FaHandshake, FaFilePdf } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { fetchAllPages } from "../../utils/apiClient/fetchAllPages";
import { pdf } from "@react-pdf/renderer";
import BuyerProformaInvoicePDF from "../../components/BuyerDashboard/BuyerProformaInvoicePDF";
import { downloadFile } from "../../utils/fileDownloader";
import DataDropdown from "../../common/DataDropdown/DataDropdown";

const Tables = lazy(() => import("../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../common/Paginations/Paginations"),
);
const DateSelector = lazy(
  () => import("../../common/DateSelector/DateSelector"),
);

const API_URL = "/loading-entries/brokerage-report";

const BuyerBrokerage = () => {
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
  const [exporting, setExporting] = useState(false);

  const [buyerOptions, setBuyerOptions] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
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
        const response = await api.get("/buyers");
        const buyers = (response.data || []).map(b => ({
          value: b.companyName || b.name,
          label: b.companyName || b.name
        })).sort((a, b) => a.label.localeCompare(b.label));
        
        // Remove duplicates if any
        const uniqueBuyers = Array.from(new Set(buyers.map(b => b.value)))
          .map(value => buyers.find(b => b.value === value));
          
        setBuyerOptions(uniqueBuyers);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: "buyer",
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buyerCompany: selectedBuyer?.value || undefined,
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
  }, [currentPage, itemsPerPage, debouncedSearchInput, startDate, endDate, selectedBuyer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setSelectedBuyer(null);
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

  const handleDownloadExcel = useCallback(async () => {
    if (exporting) return;
    let toastId;
    try {
      setExporting(true);
      toastId = toast.loading("Preparing Buyer Brokerage Excel...");

      const params = {
        type: "buyer",
        search: searchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buyerCompany: selectedBuyer?.value || undefined,
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
        `BuyerBrokerage_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error("Failed to download Excel file");
    } finally {
      setExporting(false);
    }
  }, [searchInput, startDate, endDate, selectedBuyer, selectedIds, exporting]);

  const handleDownloadPDF = useCallback(async () => {
    if (exporting) return;
    const toastId = toast.loading("Preparing Buyer Brokerage PDF...");
    try {
      setExporting(true);

      const params = {
        type: "buyer",
        search: searchInput?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buyerCompany: selectedBuyer?.value || undefined,
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
        `BuyerBrokerage_${new Date().toISOString().split("T")[0]}.pdf`,
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
  }, [searchInput, startDate, endDate, selectedBuyer, selectedIds, exporting]);

  const headers = [
      <input
        key="select-all"
        type="checkbox"
        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        checked={data.length > 0 && selectedIds.length === data.length}
        onChange={handleSelectAll}
      />,
      "Sl No",
      "Loading Date",
      "Sauda No",
      "Bill No",
      "Lorry No",
      "Buyer Company",
      "Seller Name",
      "Commodity",
      "Loading Wt",
      "Unloading Wt",
      "Calculated Wt",
      "Brokerage / Ton",
      "Total Brokerage",
    ];

    const rows = useMemo(
      () =>
        data.map((item, index) => {
          const slNo = (currentPage - 1) * itemsPerPage + index + 1;
          const formattedDate = item.loadingDate
            ? new Date(item.loadingDate).toLocaleDateString("en-GB")
            : "N/A";
          const calculatedWeight = item.calculatedWeight || 
            (item.unloadingWeight || item.unloadingWeight === 0 ? item.unloadingWeight : item.loadingWeight);

          return [
            <input
              key={`select-${item._id}`}
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
              key={`buyer-${item._id}`}
              className="font-bold text-slate-800 text-[11px]"
            >
              {item.buyerCompany || "N/A"}
            </span>,
            <span
              key={`seller-${item._id}`}
              className="font-medium text-slate-600 text-[11px]"
            >
              {item.sellerAccount || "N/A"}
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
              className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 text-[11px]"
            >
              {calculatedWeight || 0} T
            </span>,
            <span
              key={`brk-${item._id}`}
              className="font-bold text-indigo-600 text-[11px]"
            >
              ₹{item.brokerageRate || 0} / T
            </span>,
            <span
              key={`total-${item._id}`}
              className="font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 text-[11px]"
            >
              ₹{item.totalBrokerage?.toFixed(2) || "0.00"}
            </span>,
          ];
        }),
      [data, currentPage, itemsPerPage, selectedIds],
    );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Buyer Brokerage"
        subtitle="Manage and track buyer-side brokerage records"
        icon={FaHandshake}
        noContentCard
      >
        <div className="relative min-h-screen overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
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
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50"
                  >
                    <FaDownload size={14} />
                    <span>{exporting ? "..." : "Excel"}</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                  >
                    <FaFilePdf size={14} />
                    <span>{exporting ? "..." : "PDF Report"}</span>
                  </button>
                  <div className="h-10 w-[1px] bg-slate-100 hidden sm:block mx-2" />
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-[200px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Select Buyer
                      </span>
                      <DataDropdown
                        options={buyerOptions}
                        selectedOptions={selectedBuyer}
                        onChange={setSelectedBuyer}
                        placeholder="All Buyers"
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
                      <DateSelector selectedDate={endDate} onChange={setEndDate} />
                    </div>
                    {(startDate || endDate || searchInput || selectedBuyer) && (
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
                        className="text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by Sauda, Buyer, Seller, Lorry or Commodity..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-8 border border-white/60 shadow-2xl shadow-slate-200/50">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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

export default BuyerBrokerage;
