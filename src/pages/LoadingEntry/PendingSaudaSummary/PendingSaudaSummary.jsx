import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaClock, FaStore, FaTruck, FaBoxOpen, FaSearch, FaSync } from "react-icons/fa";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import Buttons from "../../../common/Buttons/Buttons";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));

const PendingSaudaSummary = () => {
  const { userRole, mobile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consigneeMap, setConsigneeMap] = useState(new Map());
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [summaryStats, setSummaryStats] = useState({
    totalPendingWeight: 0,
    activeSellers: 0,
    totalConsignees: 0,
  });

  const fetchConsignees = useCallback(async () => {
    try {
      const consignees = await fetchAllPages("/consignees", { limit: 500 });
      const map = new Map();
      consignees.forEach((c) => {
        if (c?._id) map.set(String(c._id), c.name || c.label || "-");
      });
      setConsigneeMap(map);
    } catch (error) {
      console.error("Error fetching consignees:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/self-order/pending/summary", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          userRole,
          mobile
        }
      });
      
      const { data: pagedData, total, summaryStats: stats } = response.data;
      setData(pagedData || []);
      setTotalItems(total || 0);

      if (stats) {
        setSummaryStats({
          totalPendingWeight: stats.totalPendingWeight || 0,
          activeSellers: stats.activeSellers || 0,
          totalConsignees: stats.totalConsignees || 0,
        });
      }
      setLastUpdated(new Date());

    } catch (error) {
      console.error("Error fetching pending sauda summary:", error);
      toast.error("Failed to fetch pending sauda summary");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, userRole, mobile]);

  useEffect(() => {
    fetchConsignees();
  }, [fetchConsignees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
    toast.info("Summary updated");
  };

  const getConsigneeName = (id) => {
    if (!id) return "N/A";
    return consigneeMap.get(String(id)) || id;
  };

  const handleSearch = (q) => {
    setSearchTerm(q);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const headers = [
    "Sl No",
    "Seller Name",
    "Consignee",
    "Total Pending Qty (Tons)",
    "Pending Brokerage",
    "No. of Saudas",
    "Details",
  ];

  const rows = data.map((item, index) => [
    <span key={`sl-${index}`} className="font-black text-slate-400">
      {(currentPage - 1) * itemsPerPage + index + 1}
    </span>,
    <div key={`seller-${index}`} className="flex items-center gap-2">
      <FaStore className="text-emerald-500" />
      <span className="font-bold text-slate-800 uppercase tracking-tight">
        {item.sellerName || "N/A"}
      </span>
    </div>,
    <div key={`consignee-${index}`} className="flex items-center gap-2">
      <FaTruck className="text-blue-500" />
      <span className="font-medium text-slate-700">
        {getConsigneeName(item.consignee)}
      </span>
    </div>,
    <span key={`qty-${index}`} className="font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
      {item.totalPendingQuantity.toFixed(2)} T
    </span>,
    <span key={`brokerage-${index}`} className="font-bold text-slate-600">
      ₹ {item.totalPendingBrokerage ? item.totalPendingBrokerage.toFixed(2) : "0.00"}
    </span>,
    <span key={`count-${index}`} className="font-bold text-slate-600">
      {item.saudaCount}
    </span>,
    <div key={`details-${index}`} className="max-w-[200px] text-[10px] text-slate-500 italic truncate">
      {item.saudas.map(s => s.saudaNo).join(", ")}
    </div>
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Pending Sauda Intelligence"
        subtitle="Consignee-wise summary of unfulfilled sauda quantities"
        icon={FaClock}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Dashboard Header with Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                <FaClock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">System Intelligence</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Pending Sauda Summary</h3>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Intelligence Update</p>
                <p className="text-xs font-bold text-slate-600">{lastUpdated.toLocaleTimeString()}</p>
              </div>
              <Buttons
                label="Refresh Data"
                icon={FaSync}
                onClick={handleRefresh}
                variant="secondary"
                size="sm"
                className="!rounded-xl shadow-sm"
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className={`grid grid-cols-1 ${userRole === "Seller" ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6`}>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-900/5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pending Weight</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                {summaryStats.totalPendingWeight.toFixed(2)} <span className="text-lg opacity-40">T</span>
              </h3>
            </div>
            {userRole !== "Seller" && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-900/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Sellers</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {summaryStats.activeSellers}
                </h3>
              </div>
            )}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-900/5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Consignees</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                {summaryStats.totalConsignees}
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Search and Filters Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-full lg:max-w-md">
                <SearchBox
                  placeholder="Search by seller or consignee..."
                  onSearch={handleSearch}
                  returnQuery
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                <FaSearch size={12} className="text-slate-300" />
                Live Filtering Enabled
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5 overflow-hidden">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loading />
                </div>
              ) : data.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <FaBoxOpen size={48} className="text-slate-200" />
                  <p className="font-medium text-lg">No pending saudas found</p>
                </div>
              ) : (
                <Tables headers={headers} rows={rows} />
              )}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default PendingSaudaSummary;
