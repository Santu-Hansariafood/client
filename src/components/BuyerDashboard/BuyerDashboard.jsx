import {
  Suspense,
  lazy,
  useEffect,
  useState,
  useMemo,
  memo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaGavel,
  FaBoxOpen,
  FaChartLine,
  FaWallet,
  FaWeightHanging,
  FaClock,
  FaPlus,
  FaHistory,
  FaChartBar,
  FaDownload,
  FaExclamationTriangle,
  FaSync,
  FaCheckCircle,
  FaArrowLeft,
  FaSyncAlt,
} from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { pdf } from "@react-pdf/renderer";
import BuyerProformaInvoicePDF from "./BuyerProformaInvoicePDF";
import { downloadFile } from "../../utils/fileDownloader";
import logo from "../../assets/Hans.png";

const HeaderSection = memo(({ userName, totalBrokerage, companyName }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="relative bg-white border border-blue-100 rounded-[1.5rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/30 skew-x-12 translate-x-1/4" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-28 md:h-28 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg md:shadow-xl shadow-blue-100 ring-2 md:ring-4 ring-blue-50/50 p-2 md:p-3">
            <img
              src={logo}
              alt="Hansaria Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-2">
              <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                Hansaria Buyer Portal
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">
              {greeting},{" "}
              <span className="text-blue-600 truncate block sm:inline">
                {userName?.split(" ")[0] || "Partner"}
              </span>
            </h1>
            <p className="text-slate-500/60 text-[10px] md:text-sm font-semibold mt-0.5 md:mt-1 hidden sm:block">
              Managing procurement for{" "}
              <span className="text-slate-800">
                {companyName || "Verified Buyer"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:border-l lg:border-blue-100 lg:pl-10">
          <div className="bg-blue-50/50 border border-blue-100 px-4 py-3 md:px-10 md:py-6 rounded-[1rem] md:rounded-[2rem] flex-1 sm:min-w-[240px] shadow-inner text-center">
            <p className="text-[8px] md:text-[10px] font-bold text-blue-600/60 uppercase tracking-widest mb-1 md:mb-2">
              Total Brokerage
            </p>
            <div className="flex items-baseline justify-center gap-1 md:gap-1.5">
              <span className="text-[10px] md:text-xs font-black text-blue-600/40">
                Rs.
              </span>
              <span className="text-xl md:text-4xl font-black text-slate-800 tracking-tighter">
                {totalBrokerage.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

HeaderSection.displayName = "HeaderSection";
HeaderSection.propTypes = {
  userName: PropTypes.string,
  totalBrokerage: PropTypes.number.isRequired,
  companyName: PropTypes.string,
};

const StatCard = memo(
  ({ title, value, unit, icon, colorClass, subtitle, onClick }) => (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-6 transition-all duration-500 ${onClick ? "cursor-pointer hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500" : ""}`}
    >
      <div
        className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-inner ring-2 md:ring-4 ring-white shrink-0`}
      >
        <span
          className={`text-xl md:text-2xl ${colorClass.replace("bg-", "text-")}`}
        >
          {typeof icon === "function" ? icon({}) : icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-0.5 md:mb-1 truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <p className="text-lg md:text-2xl font-black text-slate-800 tracking-tight truncate">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          {unit && (
            <span className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
              {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[7px] md:text-[9px] text-blue-600 font-bold mt-0.5 md:mt-1 uppercase tracking-widest truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  ),
);

StatCard.displayName = "StatCard";
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  colorClass: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onClick: PropTypes.func,
};

const CommodityItem = memo(
  ({ item, totalQuantity, onAction, actionLabel, type = "commodity" }) => {
    const brokerage = item?.brokerage || 0;
    const quantity = item?.quantity || 0;
    const percentage = useMemo(
      () => Math.min((quantity / (totalQuantity || 1)) * 100, 100),
      [quantity, totalQuantity],
    );

    return (
      <div className="group relative bg-white hover:bg-blue-50/30 p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] border border-slate-100 transition-all duration-300 shadow-sm md:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5">
          <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
            <div
              className={`h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform ${type === "company" ? "bg-indigo-700" : "bg-blue-700"}`}
            >
              <span className="text-xs md:text-sm font-black tracking-tighter italic">
                {item?._id?.substring(0, 2) || "BR"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className={`text-xs md:text-sm font-black uppercase tracking-wider truncate ${type === "company" ? "text-indigo-800" : "text-blue-800"}`}
              >
                {item?._id || "Other"}
              </h4>
              <div className="flex items-center gap-1.5 md:gap-3 mt-0.5 md:mt-1.5">
                <p className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 md:gap-2">
                  <FaHistory className="text-[6px] md:text-[8px]" />{" "}
                  {item?.trips || 0} Loads
                </p>
                <span className="h-0.5 w-0.5 md:h-1 md:w-1 rounded-full bg-slate-200" />
                <span
                  className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${type === "company" ? "text-indigo-500" : "text-blue-500"}`}
                >
                  {type === "company" ? "Procurement Node" : "Market Sync"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-12 shrink-0">
            <div className="text-left md:text-right">
              <p className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 md:mb-1">
                Quantity
              </p>
              <div className="flex items-baseline justify-start md:justify-end gap-0.5 md:gap-1">
                <span
                  className={`text-sm md:text-lg font-black ${type === "company" ? "text-indigo-800" : "text-blue-800"}`}
                >
                  {quantity.toFixed(1)}
                </span>
                <span className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase">
                  Tons
                </span>
              </div>
            </div>

            <div className="text-right min-w-[100px] md:min-w-[140px]">
              <p className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 md:mb-1">
                Net Brokerage
              </p>
              <div className="flex items-baseline justify-end gap-0.5 md:gap-1.5">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400">
                  Rs.
                </span>
                <span
                  className={`text-sm md:text-lg font-black ${type === "company" ? "text-indigo-800" : "text-blue-800"}`}
                >
                  {brokerage.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            {onAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(item?._id);
                }}
                className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 transition-all shadow-sm ${type === "company" ? "hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50" : "hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"}`}
                title={actionLabel || "Download Report"}
                aria-label={actionLabel || "Download Report"}
              >
                <FaDownload className="text-xs md:text-base" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 md:mt-5 h-1 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${type === "company" ? "bg-indigo-500" : "bg-blue-500"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  },
);

CommodityItem.displayName = "CommodityItem";
CommodityItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    brokerage: PropTypes.number,
    quantity: PropTypes.number,
    trips: PropTypes.number,
  }).isRequired,
  totalQuantity: PropTypes.number.isRequired,
  onAction: PropTypes.func,
  actionLabel: PropTypes.string,
  type: PropTypes.oneOf(["commodity", "company"]),
};

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, mobile } = useAuth();
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [stats, setStats] = useState({
    totalBrokerage: 0,
    totalUnloadingWeight: 0,
    totalSaudas: 0,
    pendingSaudas: 0,
    pendingBidAcceptances: 0,
    commodityBreakdown: [],
    companyBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!mobile) {
      setError("No mobile number provided. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [statsRes, profileRes] = await Promise.all([
        api.get("/self-order/buyer/stats", { params: { mobile } }),
        api.get(`/buyers?mobile=${mobile}`),
      ]);

      setStats(statsRes.data);
      if (profileRes.data?.length > 0) {
        setBuyerProfile(profileRes.data[0]);
      } else {
        setError("Buyer profile not found. Please contact administrator.");
      }
    } catch (error) {
      console.error("Error fetching buyer dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDownloadInvoice = useCallback(
    async (companyName) => {
      if (!companyName || !mobile) return;

      const toastId = toast.loading(
        `Generating brokerage report for ${companyName}...`,
      );
      try {
        const { data } = await api.get(`/loading-entries/company-report`, {
          params: { buyerCompany: companyName, mobile },
        });

        if (!data.entries || data.entries.length === 0) {
          toast.update(toastId, {
            render: "No unloading data found for this company.",
            type: "info",
            isLoading: false,
            autoClose: 3000,
          });
          return;
        }

        const blob = await pdf(
          <BuyerProformaInvoicePDF
            entries={data.entries}
            company={data.company}
          />,
        ).toBlob();

        downloadFile(
          blob,
          `Brokerage_Report_${companyName.replace(/\s+/g, "_")}.pdf`,
        );

        toast.update(toastId, {
          render: "Report generated successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } catch (err) {
        console.error("Report Generation Error:", err);
        toast.update(toastId, {
          render: "Failed to generate report. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    },
    [mobile],
  );

  const navigationItems = useMemo(
    () => [
      {
        label: "Market Bids",
        icon: <FaGavel />,
        color: "bg-emerald-600",
        link: "/manage-bids/bid-list",
        count: "Live",
      },
      {
        label: "New Bid",
        icon: <FaPlus />,
        color: "bg-blue-600",
        link: "/manage-bids/buyer",
        count: "Post",
      },
      {
        label: "Accept Bids",
        icon: <FaCheckCircle />,
        color: "bg-teal-600",
        link: "/manage-bids/bid-list/participate-bid-admin",
        count: "Accept Bids",
      },
      {
        label: "Order History",
        icon: <FaBoxOpen />,
        color: "bg-amber-600",
        link: "/manage-order/list-self-order",
        count: stats.totalSaudas,
      },
      {
        label: "Transactions",
        icon: <FaHistory />,
        color: "bg-indigo-600",
        link: "/buyer/bid-history",
        count: "View",
      },
    ],
    [stats.totalSaudas, stats.pendingBidAcceptances],
  );

  if (loading) return <Loading />;

  if (error) {
    return (
      <AdminPageShell noContentCard>
        <div className="min-h-screen flex items-center justify-center bg-blue-50/20 p-6">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border border-blue-100">
            <div className="h-24 w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <FaExclamationTriangle size={40} />
            </div>
            <h2 className="text-3xl font-black text-blue-800 italic uppercase tracking-tighter mb-4">
              Sync Error
            </h2>
            <p className="text-blue-700/60 font-bold leading-relaxed">
              {error}
            </p>
            <button
              onClick={fetchDashboardData}
              className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-3 mx-auto"
            >
              <FaSync />
              Retry Sync
            </button>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell noContentCard onRefresh={fetchDashboardData}>
        <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-10 space-y-6 md:space-y-10 lg:space-y-14 max-w-[1700px] mx-auto">
          <HeaderSection
            userName={user?.name}
            totalBrokerage={stats.totalBrokerage}
            companyName={buyerProfile?.companyName}
            onRefresh={fetchDashboardData}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 sm:gap-8">
            {navigationItems.map((item, idx) => (
              <StatCard
                key={idx}
                title={item.label}
                value={item.count}
                subtitle="Open Module"
                icon={item.icon}
                colorClass={item.color}
                onClick={() => navigate(item.link)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 sm:gap-8">
            <StatCard
              title="Procured Volume"
              value={stats.totalUnloadingWeight.toFixed(2)}
              unit="Tons"
              icon={FaWeightHanging}
              colorClass="bg-indigo-600"
              subtitle="Material Total"
            />
            <StatCard
              title="Net Settlement"
              value={`Rs. ${Math.floor(stats.totalBrokerage).toLocaleString("en-IN")}`}
              icon={FaWallet}
              colorClass="bg-blue-600"
              subtitle="Brokerage Dues"
            />
            <StatCard
              title="Active Saudas"
              value={stats.pendingSaudas}
              icon={FaClock}
              colorClass="bg-amber-600"
              subtitle="Awaiting Delivery"
            />
            <StatCard
              title="Material Reach"
              value={stats.commodityBreakdown.length}
              icon={FaChartLine}
              colorClass="bg-emerald-600"
              subtitle="Diverse Portfolio"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 sm:gap-12 items-start">
            <div className="xl:col-span-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-blue-50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500">
              <div className="p-4 md:p-8 border-b border-blue-50 bg-blue-50/20 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FaChartBar className="text-lg md:text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-black text-blue-800 uppercase tracking-tight italic">
                      Material{" "}
                      <span className="text-blue-600">Intelligence</span>
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-black text-blue-700/40 uppercase tracking-[0.3em]">
                      Precision Commodity Breakdown
                    </p>
                  </div>
                </div>
                <span className="text-[8px] md:text-[10px] font-black text-blue-600 bg-white px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-blue-100 uppercase tracking-widest shadow-sm">
                  Sync Active
                </span>
              </div>
              <div className="p-4 md:p-8 space-y-3 md:space-y-5">
                {stats.commodityBreakdown.length > 0 ? (
                  stats.commodityBreakdown.map((item, idx) => (
                    <CommodityItem
                      key={item?._id || idx}
                      item={item}
                      totalQuantity={stats.totalUnloadingWeight}
                    />
                  ))
                ) : (
                  <div className="py-12 md:py-24 text-center">
                    <FaBoxOpen className="text-3xl md:text-5xl text-blue-100 mx-auto mb-4 md:mb-6" />
                    <p className="text-blue-800/40 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
                      No intelligence data available
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-indigo-50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500">
              <div className="p-4 md:p-8 border-b border-indigo-50 bg-indigo-50/20 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <FaChartBar className="text-lg md:text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-black text-indigo-800 uppercase tracking-tight italic">
                      Entity{" "}
                      <span className="text-indigo-600">Performance</span>
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-black text-indigo-700/40 uppercase tracking-[0.3em]">
                      Company Wise Procurement Insights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/manage-order/list-self-order")}
                  className="text-[8px] md:text-[10px] font-black text-indigo-600 bg-white px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                  aria-label="View all orders"
                >
                  View All
                </button>
              </div>
              <div className="p-4 md:p-8 space-y-3 md:space-y-5">
                {stats.companyBreakdown.length > 0 ? (
                  stats.companyBreakdown.map((item, idx) => (
                    <CommodityItem
                      key={item?._id || idx}
                      item={item}
                      totalQuantity={stats.totalUnloadingWeight}
                      onAction={handleDownloadInvoice}
                      actionLabel="Download Brokerage Report"
                      type="company"
                    />
                  ))
                ) : (
                  <div className="py-12 md:py-24 text-center">
                    <FaBoxOpen className="text-3xl md:text-5xl text-indigo-100 mx-auto mb-4 md:mb-6" />
                    <p className="text-indigo-800/40 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
                      No performance data captured
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-blue-200 flex flex-wrap items-center justify-between gap-6 md:gap-12">
            <div className="flex items-center gap-6 md:gap-12">
              <div className="flex flex-col">
                <p className="text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-1 md:mb-2">
                  Account Status
                </p>
                <div className="flex items-center gap-2 md:gap-3">
                  <div
                    className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-emerald-500 animate-ping"
                    aria-hidden="true"
                  ></div>
                  <span className="text-white font-black uppercase tracking-widest text-[10px] md:text-sm">
                    Verified Partner
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/buyer/market-analytics")}
                className="flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-xs transition-all flex items-center justify-center gap-2 md:gap-3"
                aria-label="View market intelligence"
              >
                <FaChartLine className="text-blue-400" />
                Intelligence
              </button>
              <button
                onClick={() => navigate("/manage-bids/bid-list")}
                className="flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-xs transition-all shadow-xl shadow-blue-900/50 flex items-center justify-center gap-2 md:gap-3"
                aria-label="View live bidding"
              >
                <FaGavel />
                Live Bidding
              </button>
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default BuyerDashboard;
