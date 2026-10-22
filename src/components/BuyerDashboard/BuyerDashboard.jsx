import {
  Suspense,
  lazy,
  useEffect,
  useState,
  useMemo,
  memo,
  useCallback,
  useRef,
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
import api, { clearApiCache } from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { pdf } from "@react-pdf/renderer";
import BuyerProformaInvoicePDF from "./BuyerProformaInvoicePDF";
import { downloadFile } from "../../utils/fileDownloader";
import logo from "../../assets/Hans.png";
import QRCode from "qrcode";
import EmployeeIDCardPDF from "../EmployeeDashboard/EmployeeIDCardPDF";

const DashboardBlogSection = lazy(
  () => import("../../pages/Blog/components/DashboardBlogSection"),
);

const HeaderSection = memo(
  ({ userName, totalBrokerage, companyName, onPrintIDCard, isPrinting }) => {
    const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    }, []);

    return (
      <div className="relative lux-card rounded-[1.5rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-lux-gold/10 skew-x-12 translate-x-1/4" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-28 md:h-28 bg-lux-cream rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg md:shadow-xl shadow-lux-emerald/10 ring-2 md:ring-4 ring-lux-gold/30 p-2 md:p-3">
              <img
                src={logo}
                alt="Hansaria Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-2">
                <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-lux-emerald animate-pulse" />
                <p className="text-[8px] md:text-[10px] font-black text-lux-gold font-display uppercase tracking-[0.2em] md:tracking-[0.3em]">
                  Hansaria Buyer Portal
                </p>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black font-serif text-lux-ink tracking-tighter">
                {greeting},{" "}
                <span className="text-lux-emerald truncate block sm:inline">
                  {userName?.split(" ")[0] || "Partner"}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 md:mt-2">
                <p className="text-lux-muted text-[10px] md:text-sm font-semibold hidden sm:block">
                  Managing procurement for{" "}
                  <span className="text-lux-ink">
                    {companyName || "Verified Buyer"}
                  </span>
                </p>
                <button
                  onClick={onPrintIDCard}
                  disabled={isPrinting}
                  className="flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft rounded-lg text-[8px] md:text-xs font-black uppercase tracking-widest ring-1 ring-lux-gold/30 hover:from-lux-deep hover:to-lux-night transition-all disabled:opacity-50"
                >
                  {isPrinting ? "Generating..." : "Print ID Card"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:border-l lg:border-[#e9e2d3] lg:pl-10">
            <div className="bg-lux-ivory border border-[#e9e2d3] px-4 py-3 md:px-10 md:py-6 rounded-[1rem] md:rounded-[2rem] flex-1 sm:min-w-[240px] shadow-inner text-center">
              <p className="text-[8px] md:text-[10px] font-bold text-lux-gold font-display uppercase tracking-widest mb-1 md:mb-2">
                Total Brokerage
              </p>
              <div className="flex items-baseline justify-center gap-1 md:gap-1.5">
                <span className="text-[10px] md:text-xs font-black text-lux-gold">
                  Rs.
                </span>
                <span className="text-xl md:text-4xl font-black text-lux-ink tracking-tighter">
                  {totalBrokerage.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

HeaderSection.displayName = "HeaderSection";
HeaderSection.propTypes = {
  userName: PropTypes.string,
  totalBrokerage: PropTypes.number.isRequired,
  companyName: PropTypes.string,
  onPrintIDCard: PropTypes.func,
  isPrinting: PropTypes.bool,
};

const StatCard = memo(
  ({ title, value, unit, icon, colorClass, subtitle, onClick }) => (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      className={`lux-card p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm flex items-center gap-3 md:gap-6 transition-all duration-500 ${
        onClick
          ? "cursor-pointer hover:shadow-xl hover:shadow-lux-emerald/15 hover:border-[#dccfa8] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
          : ""
      }`}
    >
      <div
        className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${colorClass} shadow-inner ring-2 md:ring-4 ring-lux-cream shrink-0`}
      >
        <span
          className={`text-xl md:text-2xl ${colorClass.replace("bg-", "text-")}`}
        >
          {typeof icon === "function" ? icon({}) : icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] md:text-[10px] font-black text-lux-muted font-display uppercase tracking-[0.1em] md:tracking-[0.2em] mb-0.5 md:mb-1 truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <p className="text-lg md:text-2xl font-black text-lux-ink tracking-tight truncate">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          {unit && (
            <span className="text-[8px] md:text-xs font-black text-lux-muted uppercase tracking-widest">
              {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[7px] md:text-[9px] text-lux-emerald font-bold mt-0.5 md:mt-1 uppercase tracking-widest truncate">
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
      <div className="group relative bg-lux-cream hover:bg-lux-ivory p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] border border-[#e9e2d3] transition-all duration-300 shadow-sm md:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5">
          <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
            <div
              className={`h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform ${
                type === "company" ? "bg-lux-deep" : "bg-lux-emerald"
              }`}
            >
              <span className="text-xs md:text-sm font-black tracking-tighter italic">
                {item?._id?.substring(0, 2) || "BR"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className={`text-xs md:text-sm font-black uppercase tracking-wider truncate ${
                  type === "company" ? "text-lux-ink" : "text-lux-ink"
                }`}
              >
                {item?._id || "Other"}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mt-0.5 md:mt-1.5">
                <p className="text-[7px] md:text-[9px] font-bold text-lux-muted uppercase tracking-widest flex items-center gap-1 md:gap-2">
                  <FaHistory className="text-[6px] md:text-[8px]" />{" "}
                  {item?.trips || 0} Loads
                </p>
                <span className="h-0.5 w-0.5 md:h-1 md:w-1 rounded-full bg-[#dccfa8]" />
                <span
                  className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${
                    type === "company" ? "text-lux-gold" : "text-lux-gold"
                  }`}
                >
                  {type === "company" ? "Procurement Node" : "Market Sync"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-12 shrink-0">
            <div className="text-left md:text-right">
              <p className="text-[7px] md:text-[9px] font-bold text-lux-muted uppercase tracking-widest mb-0 md:mb-1">
                Quantity
              </p>
              <div className="flex items-baseline justify-start md:justify-end gap-0.5 md:gap-1">
                <span
                  className={`text-sm md:text-lg font-black ${
                    type === "company" ? "text-lux-ink" : "text-lux-ink"
                  }`}
                >
                  {quantity.toFixed(1)}
                </span>
                <span className="text-[7px] md:text-[10px] font-bold text-lux-muted uppercase">
                  Tons
                </span>
              </div>
            </div>

            <div className="text-right min-w-[100px] md:min-w-[140px]">
              <p className="text-[7px] md:text-[9px] font-bold text-lux-muted uppercase tracking-widest mb-0 md:mb-1">
                Net Brokerage
              </p>
              <div className="flex items-baseline justify-end gap-0.5 md:gap-1.5">
                <span className="text-[8px] md:text-[10px] font-black text-lux-muted">
                  Rs.
                </span>
                <span
                  className={`text-sm md:text-lg font-black ${
                    type === "company" ? "text-lux-ink" : "text-lux-ink"
                  }`}
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
                className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-lux-cream border border-[#e9e2d3] flex items-center justify-center text-lux-muted transition-all shadow-sm ${
                  type === "company"
                    ? "hover:text-lux-emerald hover:border-lux-gold/40 hover:bg-lux-ivory"
                    : "hover:text-lux-emerald hover:border-lux-gold/40 hover:bg-lux-ivory"
                }`}
                title={actionLabel || "Download Report"}
                aria-label={actionLabel || "Download Report"}
              >
                <FaDownload className="text-xs md:text-base" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 md:mt-5 h-1 md:h-2 w-full bg-[#ece4d2] rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              type === "company" ? "bg-lux-gold" : "bg-lux-emerald"
            }`}
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);
  const abortControllerRef = useRef(null);
  const visibilityTimerRef = useRef(null);
  const hasRenderedDataRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const convertLogo = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Logo conversion failed", e);
      }
    };
    convertLogo();
  }, []);

  const retryWithBackoff = useCallback(
    async (fn, retries = 2, delayMs = 1000) => {
      let lastErr;
      for (let i = 0; i <= retries; i++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          if (i === retries) break;
          await new Promise((res) => setTimeout(res, delayMs * 2 ** i));
        }
      }
      throw lastErr;
    },
    [],
  );

  const fetchDashboardData = useCallback(
    async (options = {}) => {
      const { forceNetwork = false, showLoading = true } = options;

      if (!mobile) {
        setError("No mobile number provided. Please log in again.");
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const hadPriorData = hasRenderedDataRef.current;
      if (showLoading && !hadPriorData) {
        setLoading(true);
      }
      setError(null);

      try {
        if (forceNetwork) {
          clearApiCache();
        }

        const signal = controller.signal;
        const buildReq = (config, fallbackData) =>
          retryWithBackoff(() =>
            api({ ...config, signal }).catch((e) => ({
              data: fallbackData,
              error: true,
            })),
          );

        const results = await Promise.allSettled([
          buildReq(
            {
              method: "get",
              url: "/self-order/buyer/stats",
              params: { mobile },
            },
            {
              totalBrokerage: 0,
              totalUnloadingWeight: 0,
              totalSaudas: 0,
              pendingSaudas: 0,
              pendingBidAcceptances: 0,
              commodityBreakdown: [],
              companyBreakdown: [],
            },
          ),
          buildReq({ method: "get", url: `/buyers?mobile=${mobile}` }, []),
        ]);

        if (signal.aborted) return;

        const unwrap = (r, fallback) =>
          r.status === "fulfilled" && !r.value?.error
            ? r.value
            : { data: fallback, error: true };

        const statsRes = unwrap(results[0], {
          totalBrokerage: 0,
          totalUnloadingWeight: 0,
          totalSaudas: 0,
          pendingSaudas: 0,
          pendingBidAcceptances: 0,
          commodityBreakdown: [],
          companyBreakdown: [],
        });
        const profileRes = unwrap(results[1], []);

        const mergedStats = {
          totalBrokerage: 0,
          totalUnloadingWeight: 0,
          totalSaudas: 0,
          pendingSaudas: 0,
          pendingBidAcceptances: 0,
          commodityBreakdown: [],
          companyBreakdown: [],
          ...(statsRes?.data || {}),
        };
        setStats(mergedStats);

        const buyerList = profileRes?.data || [];
        if (buyerList.length > 0) {
          setBuyerProfile(buyerList[0]);
          hasRenderedDataRef.current = true;
        } else if (!hadPriorData) {
          throw new Error(
            profileRes.error ? "Profile sync failed" : "Buyer profile missing",
          );
        } else if (profileRes.error) {
          toast.warn("Profile refresh failed. Showing latest data.");
        }

        if (statsRes.error && hadPriorData) {
          toast.warn("Stats refresh failed. Showing latest values.");
        }
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) return;
        if (!hasRenderedDataRef.current) {
          console.error("Error fetching buyer dashboard data:", err);
          setError("Failed to load dashboard data. Please try again.");
        } else {
          toast.warn("Dashboard refresh failed. Showing cached data.");
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [mobile, retryWithBackoff],
  );

  const refreshDashboard = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchDashboardData({ forceNetwork: true, showLoading: true });
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData({ showLoading: true });
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchDashboardData, retryCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
      visibilityTimerRef.current = setTimeout(() => {
        fetchDashboardData({ forceNetwork: false, showLoading: false });
      }, 400);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleOnline = () => {
      fetchDashboardData({ forceNetwork: true, showLoading: false });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
      if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
    };
  }, [fetchDashboardData]);

  const handlePrintIDCard = useCallback(async () => {
    if (!user) {
      toast.error("User data not found!");
      return;
    }

    setIsPrinting(true);
    const toastId = toast.loading("Generating ID Card...");
    try {
      const qrData = JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: "Buyer",
        status: "Verified",
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 200,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const employeeId =
        user._id?.length >= 18
          ? user._id.substring(18).toUpperCase()
          : user._id?.slice(-6).toUpperCase() || "NA";

      const doc = (
        <EmployeeIDCardPDF
          user={{
            ...user,
            role: "BUYER PARTNER",
            employeeId,
          }}
          qrCodeData={qrCodeUrl}
          logoUrl={logoBase64}
          role="Buyer"
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ID_Card_Buyer_${user.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: "ID Card generated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: `Failed to generate ID Card: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsPrinting(false);
    }
  }, [user, logoBase64]);

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

        const totalBrokerage = (data.entries || []).reduce(
          (sum, entry) => sum + (Number(entry.buyerBrokerage) || 0),
          0,
        );
        const upiId = "MSHANSARIAFOODPRIVATELIMITED.eazypay@icici";
        const upiName = "M/S.HANSARIA FOOD PRIVATE LIMITED";
        const upiTxnRef = `INV-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 6)}`;
        const upiAmount = totalBrokerage.toFixed(2);
        const upiPaymentLink =
          `upi://pay?pa=${encodeURIComponent(upiId)}` +
          `&pn=${encodeURIComponent(upiName)}` +
          `&tr=${encodeURIComponent(upiTxnRef)}` +
          `&am=${encodeURIComponent(upiAmount)}` +
          `&cu=INR&mc=5172`;
        const upiQrCodeUrl = await QRCode.toDataURL(upiPaymentLink, {
          margin: 1,
          width: 180,
          color: { dark: "#000000", light: "#ffffff" },
        });

        const blob = await pdf(
          <BuyerProformaInvoicePDF
            entries={data.entries}
            company={data.company}
            upiQrCodeUrl={upiQrCodeUrl}
            upiId={upiId}
            upiAmount={upiAmount}
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
        color: "bg-lux-emerald",
        link: "/manage-bids/bid-list",
        count: "Live",
      },
      {
        label: "New Bid",
        icon: <FaPlus />,
        color: "bg-lux-deep",
        link: "/manage-bids/buyer",
        count: "Post",
      },
      {
        label: "Accept Bids",
        icon: <FaCheckCircle />,
        color: "bg-lux-emerald",
        link: "/manage-bids/bid-list/participate-bid-admin",
        count: stats.pendingBidAcceptances || 0, // now dynamic
      },
      {
        label: "Order History",
        icon: <FaBoxOpen />,
        color: "bg-lux-gold",
        link: "/manage-order/list-self-order",
        count: stats.totalSaudas,
      },
      {
        label: "Transactions",
        icon: <FaHistory />,
        color: "bg-lux-deep",
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
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 sm:p-6">
          <div className="lux-card p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-center max-w-lg">
            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 animate-bounce">
              <FaExclamationTriangle size={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-lux-ink italic uppercase tracking-tighter mb-4">
              Sync Error
            </h2>
            <p className="text-lux-muted font-bold leading-relaxed text-sm sm:text-base">
              {error}
            </p>
            <button
              onClick={refreshDashboard}
              className="mt-6 sm:mt-8 px-8 sm:px-10 py-3 sm:py-4 bg-lux-emerald text-lux-gold-soft rounded-2xl font-black uppercase tracking-widest hover:bg-lux-deep transition-all shadow-xl shadow-lux-emerald/20 flex items-center gap-3 mx-auto text-sm sm:text-base"
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
      <AdminPageShell noContentCard onRefresh={refreshDashboard}>
        <div className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6 lg:p-10 space-y-4 sm:space-y-6 md:space-y-10 lg:space-y-14 max-w-[1700px] mx-auto">
          <HeaderSection
            userName={user?.name}
            totalBrokerage={stats.totalBrokerage}
            companyName={buyerProfile?.companyName}
            onPrintIDCard={handlePrintIDCard}
            isPrinting={isPrinting}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <StatCard
              title="Procured Volume"
              value={stats.totalUnloadingWeight.toFixed(2)}
              unit="Tons"
              icon={FaWeightHanging}
              colorClass="bg-lux-deep"
              subtitle="Material Total"
            />
            <StatCard
              title="Net Settlement"
              value={`Rs. ${Math.floor(stats.totalBrokerage).toLocaleString(
                "en-IN",
              )}`}
              icon={FaWallet}
              colorClass="bg-lux-gold"
              subtitle="Brokerage Dues"
            />
            <StatCard
              title="Active Saudas"
              value={stats.pendingSaudas}
              icon={FaClock}
              colorClass="bg-lux-emerald"
              subtitle="Awaiting Delivery"
            />
            <StatCard
              title="Material Reach"
              value={stats.commodityBreakdown.length}
              icon={FaChartLine}
              colorClass="bg-lux-emerald"
              subtitle="Diverse Portfolio"
            />
          </div>

          <DashboardBlogSection />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-start">
            <div className="lux-card rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500">
              <div className="p-3 sm:p-4 md:p-8 border-b border-[#e9e2d3] bg-lux-ivory/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep flex items-center justify-center text-lux-gold-soft shadow-lg">
                    <FaChartBar className="text-base sm:text-lg md:text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-xl font-black font-serif text-lux-ink uppercase tracking-tight italic">
                      Material{" "}
                      <span className="text-lux-emerald">Intelligence</span>
                    </h3>
                    <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-lux-muted font-display uppercase tracking-[0.2em] md:tracking-[0.3em]">
                      Precision Commodity Breakdown
                    </p>
                  </div>
                </div>
                <span className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-lux-emerald bg-lux-cream px-2 sm:px-3 md:px-4 py-1 rounded-full border border-[#e9e2d3] uppercase tracking-widest shadow-sm">
                  Sync Active
                </span>
              </div>
              <div className="p-3 sm:p-4 md:p-8 space-y-2 sm:space-y-3 md:space-y-5">
                {stats.commodityBreakdown.length > 0 ? (
                  stats.commodityBreakdown.map((item, idx) => (
                    <CommodityItem
                      key={item?._id || idx}
                      item={item}
                      totalQuantity={stats.totalUnloadingWeight}
                    />
                  ))
                ) : (
                  <div className="py-8 sm:py-12 md:py-24 text-center">
                    <FaBoxOpen className="text-2xl sm:text-3xl md:text-5xl text-lux-gold/30 mx-auto mb-3 sm:mb-4 md:mb-6" />
                    <p className="text-lux-muted font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] md:text-xs">
                      No intelligence data available
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lux-card rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500">
              <div className="p-3 sm:p-4 md:p-8 border-b border-[#e9e2d3] bg-lux-ivory/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep flex items-center justify-center text-lux-gold-soft shadow-lg">
                    <FaChartBar className="text-base sm:text-lg md:text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-xl font-black font-serif text-lux-ink uppercase tracking-tight italic">
                      Entity{" "}
                      <span className="text-lux-gold">Performance</span>
                    </h3>
                    <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-lux-muted font-display uppercase tracking-[0.2em] md:tracking-[0.3em]">
                      Company Wise Procurement Insights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/manage-order/list-self-order")}
                  className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-lux-emerald bg-lux-cream px-2 sm:px-3 md:px-4 py-1 rounded-full border border-[#e9e2d3] uppercase tracking-widest shadow-sm hover:bg-lux-emerald hover:text-lux-cream transition-all"
                  aria-label="View all orders"
                >
                  View All
                </button>
              </div>
              <div className="p-3 sm:p-4 md:p-8 space-y-2 sm:space-y-3 md:space-y-5">
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
                  <div className="py-8 sm:py-12 md:py-24 text-center">
                    <FaBoxOpen className="text-2xl sm:text-3xl md:text-5xl text-lux-gold/30 mx-auto mb-3 sm:mb-4 md:mb-6" />
                    <p className="text-lux-muted font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] md:text-xs">
                      No performance data captured
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-gradient-to-br from-lux-night via-lux-deep to-lux-night p-4 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] ring-1 ring-lux-gold/20 shadow-2xl shadow-lux-emerald/20 flex flex-wrap items-center justify-between gap-4 sm:gap-6 md:gap-12">
            <div className="flex items-center gap-4 sm:gap-6 md:gap-12">
              <div className="flex flex-col">
                <p className="text-lux-gold text-[7px] sm:text-[8px] md:text-[10px] font-black font-display uppercase tracking-[0.2em] md:tracking-[0.3em] mb-0.5 sm:mb-1 md:mb-2">
                  Account Status
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                  <div
                    className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 rounded-full bg-lux-gold animate-ping"
                    aria-hidden="true"
                  ></div>
                  <span className="text-white font-black uppercase tracking-widest text-[8px] sm:text-[10px] md:text-sm">
                    Verified Partner
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/buyer/market-analytics")}
                className="flex-1 sm:flex-none px-3 sm:px-4 md:px-8 py-2 sm:py-3 md:py-4 bg-lux-gold/10 hover:bg-lux-gold/20 border border-lux-gold/30 text-lux-gold-soft rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[7px] sm:text-[8px] md:text-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3"
                aria-label="View market intelligence"
              >
                <FaChartLine className="text-lux-gold text-sm sm:text-base" />
                <span className="hidden xs:inline">Intelligence</span>
              </button>
              <button
                onClick={() => navigate("/manage-bids/bid-list")}
                className="flex-1 sm:flex-none px-3 sm:px-4 md:px-8 py-2 sm:py-3 md:py-4 bg-lux-emerald hover:bg-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[7px] sm:text-[8px] md:text-xs transition-all shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3"
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
