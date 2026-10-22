import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import { toast } from "react-toastify";
import {
  FaClock,
  FaStore,
  FaTruck,
  FaBoxOpen,
  FaSearch,
  FaSync,
} from "react-icons/fa";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import Buttons from "../../../common/Buttons/Buttons";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));

const PendingSaudaSummary = () => {
  const { userRole, mobile } = useAuth();
  const navigate = useNavigate();
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
    totalUnloadingWeight: 0,
    totalPendingBrokerage: 0,
    totalLoadedBrokerage: 0,
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
          mobile,
        },
      });

      const { data: pagedData, total, summaryStats: stats } = response.data;
      setData(pagedData || []);
      setTotalItems(total || 0);

      if (stats) {
        setSummaryStats({
          totalPendingWeight: stats.totalPendingWeight || 0,
          totalUnloadingWeight: stats.totalUnloadingWeight || 0,
          totalPendingBrokerage: stats.totalPendingBrokerage || 0,
          totalLoadedBrokerage: stats.totalLoadedBrokerage || 0,
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
    "Pending Qty (T)",
    "Loaded Qty (T)",
    "Brokerage Details",
    "No. of Saudas",
    "Details",
  ];

  const rows = data.map((item, index) => {
    const loadedBrokerage = item.totalLoadedBrokerage || 0;
    const pendingBrokerage = item.totalPendingBrokerage || 0;
    const totalBrokerage = loadedBrokerage + pendingBrokerage;

    return [
      <span key={`sl-${index}`} className="font-black text-lux-muted">
        {(currentPage - 1) * itemsPerPage + index + 1}
      </span>,
      <div key={`seller-${index}`} className="flex items-center gap-2">
        <FaStore className="text-lux-gold" />
        <span className="font-bold text-lux-ink uppercase tracking-tight">
          {item.sellerName || "N/A"}
        </span>
      </div>,
      <div key={`consignee-${index}`} className="flex items-center gap-2">
        <FaTruck className="text-lux-emerald" />
        <span className="font-medium text-lux-ink">
          {getConsigneeName(item.consignee)}
        </span>
      </div>,
      <span
        key={`qty-${index}`}
        className={`font-black ${item.totalPendingQuantity < 0 ? "text-rose-600 bg-rose-50 border-rose-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"} px-3 py-1 rounded-lg border tabular-nums`}
      >
        {item.totalPendingQuantity.toFixed(2)} T
      </span>,
      <span
        key={`loaded-qty-${index}`}
        className="font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 tabular-nums"
      >
        {(item.totalUnloadingWeight || 0).toFixed(2)} T
      </span>,
      <div key={`brokerage-${index}`} className="flex flex-col text-[11px]">
        <span className="font-black text-lux-ink">
          Total: ₹{totalBrokerage.toFixed(2)}
        </span>
        <span className="text-lux-emerald font-bold">
          Loaded: ₹{loadedBrokerage.toFixed(2)}
        </span>
        <span className="text-lux-emerald font-bold">
          Pending: ₹{pendingBrokerage.toFixed(2)}
        </span>
      </div>,
      <span key={`count-${index}`} className="font-bold text-lux-ink">
        {item.saudaCount}
      </span>,
      <div key={`action-${index}`} className="flex items-center gap-2">
        <button
          onClick={() => {
            const state = {
              mobile,
              userRole,
              sellerCompany: item.sellerName,
              consignee: item.consignee,
            };
            navigate("/Loading-Entry/pending-loading-list", { state });
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-xs font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
        >
          <FaBoxOpen /> View Saudas
        </button>
      </div>,
    ];
  });

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Pending Sauda Intelligence"
        subtitle="Consignee-wise summary of unfulfilled sauda quantities"
        icon={FaClock}
        noContentCard
      >
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-lux-ivory text-lux-emerald ring-1 ring-lux-gold/30 shadow-sm">
                <FaClock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-lux-muted uppercase tracking-[0.2em] leading-tight">
                  System Intelligence
                </p>
                <h3 className="font-serif text-xl font-semibold text-lux-ink tracking-tight">
                  Pending Sauda Summary
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-lux-muted uppercase tracking-widest">
                  Last Intelligence Update
                </p>
                <p className="text-xs font-bold text-lux-ink">
                  {lastUpdated.toLocaleTimeString()}
                </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="lux-card lux-card-hover p-6 sm:p-8">
              <p className="lux-eyebrow mb-2">
                Total Pending Weight
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-lux-ink tabular-nums">
                {summaryStats.totalPendingWeight.toFixed(2)}{" "}
                <span className="text-lg opacity-40">T</span>
              </h3>
            </div>
            <div className="lux-card lux-card-hover p-6 sm:p-8">
              <p className="lux-eyebrow mb-2">
                Total Unloading Weight
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-lux-emerald tabular-nums">
                {summaryStats.totalUnloadingWeight.toFixed(2)}{" "}
                <span className="text-lg opacity-40">T</span>
              </h3>
            </div>
            <div className="lux-card lux-card-hover p-6 sm:p-8">
              <p className="lux-eyebrow mb-2">
                Total Brokerage
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-lux-ink tabular-nums">
                ₹
                {(
                  summaryStats.totalLoadedBrokerage +
                  summaryStats.totalPendingBrokerage
                ).toFixed(0)}
              </h3>
              <div className="mt-2 flex gap-2 text-[10px] font-bold">
                <span className="text-lux-emerald">
                  Loaded: ₹{summaryStats.totalLoadedBrokerage.toFixed(0)}
                </span>
                <span className="text-lux-emerald">
                  Pending: ₹{summaryStats.totalPendingBrokerage.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="lux-card lux-card-hover p-6 sm:p-8">
              <p className="lux-eyebrow mb-2">
                Consignees / Sellers
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-lux-ink tabular-nums">
                {summaryStats.totalConsignees}{" "}
                <span className="text-lg opacity-40">/</span>{" "}
                {summaryStats.activeSellers}
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lux-card p-4">
              <div className="w-full lg:max-w-md">
                <SearchBox
                  placeholder="Search by seller or consignee..."
                  onSearch={handleSearch}
                  returnQuery
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lux-ivory text-[10px] font-bold text-lux-muted uppercase tracking-widest border border-lux-gold/20">
                <FaSearch size={12} className="text-lux-gold/50" />
                Live Filtering Enabled
              </div>
            </div>

            <div className="lux-card overflow-hidden">
              {loading ? (
                <Loading />
              ) : data.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-lux-muted gap-3">
                  <FaBoxOpen size={48} className="text-lux-gold/40" />
                  <p className="font-medium text-lg">No pending saudas found</p>
                </div>
              ) : (
                <Tables headers={headers} rows={rows} />
              )}
            </div>

            <div className="lux-card p-4">
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
