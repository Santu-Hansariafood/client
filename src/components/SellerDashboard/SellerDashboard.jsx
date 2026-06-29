import {
  useEffect,
  useState,
  lazy,
  Suspense,
  useMemo,
  memo,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  FaGavel,
  FaBoxOpen,
  FaChevronRight,
  FaChartBar,
  FaWeightHanging,
  FaWallet,
  FaHistory,
  FaDownload,
  FaBell,
  FaBook,
  FaTruckLoading,
  FaArrowLeft,
  FaSyncAlt,
  FaCreditCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";
import { pdf } from "@react-pdf/renderer";
import ProformaInvoicePDF from "./ProformaInvoicePDF";
import { downloadFile } from "../../utils/fileDownloader";
import logo from "../../assets/Hans.png";
import QRCode from "qrcode";
import EmployeeIDCardPDF from "../EmployeeDashboard/EmployeeIDCardPDF";
import DashboardBlogSection from "../../pages/Blog/components/DashboardBlogSection";

const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const HeaderSection = memo(({ userName, totalBrokerage, onPrintIDCard, isPrinting }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="relative bg-white border border-emerald-100 rounded-[1.5rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50/30 skew-x-12 translate-x-1/4" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-28 md:h-28 bg-white rounded-xl md:rounded-3xl flex items-center justify-center shadow-lg md:shadow-xl shadow-emerald-100 ring-2 md:ring-4 ring-emerald-50/50 p-1.5 md:p-3 shrink-0">
            <img
              src={logo}
              alt="Hansaria Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-2">
              <span className="h-1 w-1 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[7px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em] md:tracking-[0.3em] truncate">
                Hansaria Seller Portal
              </p>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-4xl font-black text-slate-800 tracking-tighter leading-tight">
              {greeting},{" "}
              <span className="text-emerald-600 block sm:inline truncate">
                Mr. {userName?.split(" ")[0] || "Partner"}
              </span>
            </h1>
            <div className="flex items-center gap-3 mt-1 md:mt-2">
              <p className="text-slate-500/60 text-[9px] md:text-sm font-semibold hidden sm:block line-clamp-1">
                Strategic intelligence and material logistics at your fingertips.
              </p>
              <button
                onClick={onPrintIDCard}
                disabled={isPrinting}
                className="flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 bg-emerald-600 text-white rounded-lg text-[8px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {isPrinting ? "Generating..." : "Print ID Card"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:border-l lg:border-emerald-100 lg:pl-10 w-full lg:w-auto">
          <div className="bg-emerald-50/50 border border-emerald-100 px-4 py-3 md:px-10 md:py-6 rounded-[1rem] md:rounded-[2rem] flex-1 sm:min-w-[200px] lg:min-w-[240px] shadow-inner text-center">
            <p className="text-[7px] md:text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-0.5 md:mb-2">
              Brokerage
            </p>
            <div className="flex items-baseline justify-center gap-1 md:gap-1.5">
              <span className="text-[8px] md:text-xs font-black text-emerald-600/40">
                Rs.
              </span>
              <span className="text-lg sm:text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">
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
  totalBrokerage: PropTypes.number,
  onPrintIDCard: PropTypes.func,
  isPrinting: PropTypes.bool,
};

const StatCard = memo(
  ({ title, value, unit, icon, colorClass, subtitle, onClick }) => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    };

    return (
      <div
        onClick={onClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        role={onClick ? "button" : "article"}
        tabIndex={onClick ? 0 : undefined}
        aria-label={`${title}: ${value} ${unit || ""}`}
        className={`bg-white p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-6 transition-all duration-500 ${onClick ? "cursor-pointer hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500" : ""}`}
      >
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-inner ring-2 md:ring-4 ring-white shrink-0`}
        >
          <span
            className={`text-lg sm:text-xl md:text-2xl ${colorClass.replace("bg-", "text-")}`}
          >
            {typeof icon === "function" ? icon({}) : icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <p className="text-sm sm:text-lg md:text-2xl font-black text-slate-800 tracking-tight truncate">
              {typeof value === "number"
                ? value.toLocaleString("en-IN")
                : value || "0"}
            </p>
            {unit && (
              <span className="text-[6px] sm:text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[6px] sm:text-[7px] md:text-[9px] text-emerald-600 font-bold mt-0.5 md:mt-1 uppercase tracking-widest truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  },
);

StatCard.displayName = "StatCard";
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
      <div
        role="listitem"
        className="group relative bg-white hover:bg-emerald-50/30 p-3 sm:p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] border border-slate-100 transition-all duration-300 shadow-sm md:shadow-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-5">
          <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg md:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform ${type === "company" ? "bg-indigo-700" : "bg-emerald-700"}`}
            >
              <span className="text-[10px] md:text-sm font-black tracking-tighter italic">
                {(item?._id || "NA").substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className={`text-[10px] md:text-sm font-black uppercase tracking-wider truncate ${type === "company" ? "text-indigo-800" : "text-emerald-800"}`}
              >
                {item?._id || "Unknown Entity"}
              </h4>
              <div className="flex items-center gap-1.5 md:gap-3 mt-0.5 md:mt-1.5">
                <p className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 md:gap-2 truncate">
                  <FaHistory
                    className="text-[5px] md:text-[8px]"
                    aria-hidden="true"
                  />{" "}
                  {item?.trips || 0} Trips
                </p>
                <span
                  className="h-0.5 w-0.5 rounded-full bg-slate-200 shrink-0"
                  aria-hidden="true"
                />
                <span
                  className={`text-[6px] md:text-[9px] font-black uppercase tracking-widest truncate ${type === "company" ? "text-indigo-500" : "text-emerald-500"}`}
                >
                  {type === "company" ? "Verified Node" : "Market Sync"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-12 shrink-0">
            <div className="text-left sm:text-right">
              <p className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 md:mb-1">
                Quantity
              </p>
              <div className="flex items-baseline justify-start sm:justify-end gap-0.5">
                <span
                  className={`text-xs md:text-lg font-black ${type === "company" ? "text-indigo-800" : "text-emerald-800"}`}
                >
                  {quantity.toFixed(1)}
                </span>
                <span className="text-[6px] md:text-[10px] font-bold text-slate-400 uppercase">
                  Tons
                </span>
              </div>
            </div>

            <div className="text-right min-w-[70px] sm:min-w-[100px] md:min-w-[140px]">
              <p className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 md:mb-1">
                Brokerage
              </p>
              <div className="flex items-baseline justify-end gap-0.5 md:gap-1.5">
                <span className="text-[7px] md:text-[10px] font-black text-slate-400">
                  ₹
                </span>
                <span
                  className={`text-xs md:text-lg font-black ${type === "company" ? "text-indigo-800" : "text-emerald-800"}`}
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
                aria-label={actionLabel || "Download Report"}
                className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 transition-all shadow-sm shrink-0 ${type === "company" ? "hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50" : "hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"}`}
                title={actionLabel || "Download Invoice"}
              >
                <FaDownload
                  className="text-[10px] md:text-base"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        <div
          className="mt-3 md:mt-5 h-1 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${type === "company" ? "bg-indigo-500" : "bg-emerald-500"}`}
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
  }),
  totalQuantity: PropTypes.number.isRequired,
  onAction: PropTypes.func,
  actionLabel: PropTypes.string,
  type: PropTypes.oneOf(["commodity", "company"]),
};

const SellerDashboard = () => {
  const { mobile, user } = useAuth();
  const {
    notifications: confirmedBids,
    unreadCount: notificationCount,
    markAsRead,
  } = useNotifications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    const convertLogo = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        toast.error("Logo conversion failed");
      }
    };
    convertLogo();
  }, []);

  const [sellerBidCount, setSellerBidCount] = useState(0);
  const [participateBidCount, setParticipateBidCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingSaudaCount, setPendingSaudaCount] = useState(0);
  const [totalBrokerage, setTotalBrokerage] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [commodityBreakdown, setCommodityBreakdown] = useState([]);
  const [companyBreakdown, setCompanyBreakdown] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const fetchData = useCallback(
    async (isMounted = true) => {
      if (!mobile) {
        setError("Identification required. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          sellersRes,
          bidsRes,
          participateRes,
          ordersRes,
          pendingRes,
          statsRes,
        ] = await Promise.all([
          api
            .get(`/sellers?mobile=${mobile}`)
            .catch((e) => ({ data: [], error: e })),
          api
            .get("/bids?status=active")
            .catch((e) => ({ data: { data: [] }, error: e })),
          api
            .get(`/participatebids?mobile=${mobile}&limit=1`)
            .catch((e) => ({ data: { total: 0 }, error: e })),
          api
            .get(
              `/self-order?sellerMobile=${mobile}&limit=1&page=1&userRole=Seller`,
            )
            .catch((e) => ({ data: { total: 0 }, error: e })),
          api
            .get(
              `/self-order/pending/list?mobile=${mobile}&userRole=Seller&limit=1&page=1`,
            )
            .catch((e) => ({ data: { total: 0 }, error: e })),
          api
            .get(`/self-order/seller/stats?mobile=${mobile}`)
            .catch((e) => ({ data: {}, error: e })),
        ]);

        if (!isMounted) return;

        if (sellersRes.error || statsRes.error) {
          throw new Error("Critical data sync failed");
        }

        const normalizePhone = (p) => {
          const m = String(p || "")
            .trim()
            .match(/^(?:\+91|0)?([6-9]\d{9})$/);
          return m ? m[1] : p;
        };

        const sellers = sellersRes?.data || [];
        const bids = bidsRes?.data?.data || bidsRes?.data || [];

        const seller = sellers.find((s) =>
          s?.phoneNumbers?.some(
            (p) => normalizePhone(p?.value) === normalizePhone(mobile),
          ),
        );

        if (!seller) {
          setError("Seller profile not found. Please contact support.");
          return;
        }

        const activeSellerBids = bids.filter(
          (bid) =>
            bid.status === "active" &&
            seller?.commodities?.some((c) => c?.name === bid?.commodity),
        );

        setSellerBidCount(activeSellerBids.length);
        setParticipateBidCount(participateRes?.data?.total || 0);
        setOrderCount(ordersRes?.data?.total || 0);
        setPendingSaudaCount(pendingRes?.data?.total || 0);
        setTotalBrokerage(statsRes?.data?.totalBrokerage || 0);
        setTotalQuantity(statsRes?.data?.totalUnloadingWeight || 0);
        setCommodityBreakdown(statsRes?.data?.commodityBreakdown || []);
        setCompanyBreakdown(statsRes?.data?.companyBreakdown || []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          "Unable to sync dashboard data. Check your connection and try again.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [mobile],
  );

  const refreshDashboard = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchData(true);
  }, [fetchData]);

  const handleNotificationClick = useCallback(
    async (notif) => {
      if (!notif.isRead) {
        try {
          await markAsRead(notif._id);
        } catch (err) {
          toast.error("Failed to mark notification as read.");
        }
      }
    },
    [markAsRead],
  );

  const togglePopup = useCallback((val) => setShowPopup(val), []);

  const handleDownloadInvoice = useCallback(
    async (companyName) => {
      if (!companyName || !mobile) return;

      const toastId = toast.loading(`Generating invoice for ${companyName}...`);
      try {
        const { data } = await api.get(`/loading-entries/company-report`, {
          params: { supplierCompany: companyName, mobile },
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
          <ProformaInvoicePDF entries={data.entries} company={data.company} />,
        ).toBlob();

        downloadFile(
          blob,
          `Proforma_Invoice_${companyName.replace(/\s+/g, "_")}.pdf`,
        );

        toast.update(toastId, {
          render: "Invoice generated successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } catch (err) {
        toast.update(toastId, {
          render: "Failed to generate invoice. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    },
    [mobile],
  );

  const handlePrintIDCard = async () => {
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
        role: "Seller",
        status: "Verified",
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 200,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const doc = (
        <EmployeeIDCardPDF
          user={{
            ...user,
            role: "SELLER PARTNER",
             employeeId: user._id?.substring(18).toUpperCase(),
           }}
           qrCodeData={qrCodeUrl}
           logoUrl={logoBase64}
           role="Seller"
         />
       );

      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ID_Card_Seller_${user.name.replace(/\s+/g, "_")}.pdf`;
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
  };

  const navigationItems = useMemo(
    () => [
      {
        label: "Today's Bids",
        icon: <FaGavel />,
        color: "bg-emerald-600",
        link: "/Supplier-Bid-List",
        state: { mobile },
        count: sellerBidCount,
      },
      {
        label: "Add Loading",
        icon: <FaTruckLoading />,
        color: "bg-emerald-500",
        link: "/Loading-Entry/add-loading-entry",
        state: { mobile },
        count: "Bill & Challan",
      },
      {
        label: "Order History",
        icon: <FaBoxOpen />,
        color: "bg-indigo-600",
        link: "/manage-order/list-self-order",
        state: { mobile },
        count: "Open Sauda",
      },
      {
        label: "Pending Sauda",
        icon: <FaBook />,
        color: "bg-amber-600",
        link: "/Loading-Entry/pending-loading-list",
        state: { mobile },
        count: pendingSaudaCount,
      },
      {
        label: "Loading List",
        icon: <FaHistory />,
        color: "bg-blue-600",
        link: "/Loading-Entry/list-loading-entry",
        state: { mobile },
        count: "Loading List",
      },
      {
        label: "Alerts",
        icon: <FaBell />,
        color: "bg-purple-600",
        isNotif: true,
        count: "Notifications",
        action: () => togglePopup(true),
      },
      {
        label: "Payment Release",
        icon: <FaCreditCard />,
        color: "bg-rose-600",
        count: "Under Development",
        subtitle: "Will live soon",
        link: "/payment-release",
      },
    ],
    [mobile, togglePopup, sellerBidCount, orderCount, pendingSaudaCount],
  );

  useEffect(() => {
    let isMounted = true;
    if (mobile) fetchData(isMounted);
    return () => {
      isMounted = false;
    };
  }, [mobile, fetchData]);

  if (loading) return <Loading />;

  if (error)
    return (
      <AdminPageShell noContentCard>
        <div className="min-h-screen flex items-center justify-center bg-emerald-50/20 p-4 sm:p-6">
          <div className="bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-center max-w-lg border border-emerald-100 w-full">
            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 animate-bounce">
              <FaGavel size={32} className="sm:hidden" />
              <FaGavel size={40} className="hidden sm:block" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-800 italic uppercase tracking-tighter mb-4">
              Sync Error
            </h2>
            <p className="text-emerald-700/60 font-bold leading-relaxed text-sm sm:text-base mb-8">
              {error}
            </p>
            <button
              onClick={refreshDashboard}
              className="w-full sm:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 mx-auto"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Retry Sync
            </button>
          </div>
        </div>
      </AdminPageShell>
    );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell noContentCard onRefresh={refreshDashboard}>
        <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-6 lg:p-10 space-y-6 md:space-y-10 lg:space-y-14 max-w-[1700px] mx-auto pb-10">
          <header>
            <HeaderSection
              userName={user?.name}
              totalBrokerage={totalBrokerage}
              onRefresh={refreshDashboard}
              onPrintIDCard={handlePrintIDCard}
              isPrinting={isPrinting}
            />
          </header>

          <section aria-label="Quick Navigation">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
              {navigationItems.map((item, idx) => (
                <StatCard
                  key={idx}
                  title={item.label}
                  value={item.count}
                  subtitle="Open Module"
                  icon={item.icon}
                  colorClass={item.color}
                  onClick={
                    item.action ||
                    (() => navigate(item.link, { state: item.state }))
                  }
                />
              ))}
            </div>
          </section>

          <section aria-label="Performance Metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                title="Consolidated Volume"
                value={totalQuantity.toFixed(2)}
                unit="Tons"
                icon={FaWeightHanging}
                colorClass="bg-indigo-600"
                subtitle="Material Total"
              />
              <StatCard
                title="Strategic Earnings"
                value={`Rs. ${Math.floor(totalBrokerage).toLocaleString("en-IN")}`}
                icon={FaWallet}
                colorClass="bg-emerald-600"
                subtitle="Settled Brokerage"
              />
              <StatCard
                title="Market Participation"
                value={participateBidCount}
                icon={FaGavel}
                colorClass="bg-teal-600"
                subtitle="Live Opportunities"
              />
              <StatCard
                title="Total Logistics"
                value={commodityBreakdown.reduce(
                  (s, c) => s + (c.trips || 0),
                  0,
                )}
                icon={FaHistory}
                colorClass="bg-amber-600"
                subtitle="Aggregate Trips"
              />
            </div>
          </section>

          <DashboardBlogSection />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 sm:gap-12 items-start">
            {/* Material Intelligence */}
            <section
              className="xl:col-span-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-emerald-50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500"
              aria-label="Material Intelligence"
            >
              <div className="p-4 md:p-8 border-b border-emerald-50 bg-emerald-50/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                    <FaChartBar
                      className="text-base md:text-xl"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-xl font-black text-emerald-800 uppercase tracking-tight italic truncate">
                      Material{" "}
                      <span className="text-emerald-600">Intelligence</span>
                    </h3>
                    <p className="text-[7px] md:text-[10px] font-black text-emerald-700/40 uppercase tracking-[0.2em] md:tracking-[0.3em] truncate">
                      Precision Commodity Breakdown
                    </p>
                  </div>
                </div>
                <span className="text-[7px] md:text-[10px] font-black text-emerald-600 bg-white px-2 md:px-4 py-1 md:py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm shrink-0">
                  Sync Active
                </span>
              </div>
              <div
                className="p-3 sm:p-4 md:p-8 space-y-3 md:space-y-5"
                role="list"
              >
                {commodityBreakdown.length > 0 ? (
                  commodityBreakdown.map((item, idx) => (
                    <CommodityItem
                      key={item?._id || idx}
                      item={item}
                      totalQuantity={totalQuantity}
                    />
                  ))
                ) : (
                  <div className="py-12 md:py-24 text-center">
                    <FaBoxOpen
                      className="text-3xl md:text-5xl text-emerald-100 mx-auto mb-4 md:mb-6"
                      aria-hidden="true"
                    />
                    <p className="text-emerald-800/40 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
                      No intelligence data available
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              className="xl:col-span-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-indigo-50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500"
              aria-label="Company Performance"
            >
              <div className="p-4 md:p-8 border-b border-indigo-50 bg-indigo-50/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                    <FaChartBar
                      className="text-base md:text-xl"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-xl font-black text-indigo-800 uppercase tracking-tight italic truncate">
                      Company{" "}
                      <span className="text-indigo-600">Performance</span>
                    </h3>
                    <p className="text-[7px] md:text-[10px] font-black text-indigo-700/40 uppercase tracking-[0.2em] md:tracking-[0.3em] truncate">
                      Entity Wise Revenue Insights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => togglePopup(true)}
                  aria-label="View Alerts"
                  className="text-[7px] md:text-[10px] font-black text-indigo-600 bg-white px-2 md:px-4 py-1 md:py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all shrink-0 focus:ring-2 focus:ring-indigo-500"
                >
                  Alerts
                </button>
              </div>
              <div
                className="p-3 sm:p-4 md:p-8 space-y-3 md:space-y-5"
                role="list"
              >
                {companyBreakdown.length > 0 ? (
                  companyBreakdown.map((item, idx) => (
                    <CommodityItem
                      key={item?._id || idx}
                      item={item}
                      totalQuantity={totalQuantity}
                      onAction={handleDownloadInvoice}
                      actionLabel="Download Proforma Invoice"
                      type="company"
                    />
                  ))
                ) : (
                  <div className="py-12 md:py-24 text-center">
                    <FaBoxOpen
                      className="text-3xl md:text-5xl text-indigo-100 mx-auto mb-4 md:mb-6"
                      aria-hidden="true"
                    />
                    <p className="text-indigo-800/40 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
                      No performance data captured
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <footer className="bg-emerald-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-emerald-200 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
            <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto justify-center md:justify-start">
              <div className="flex flex-col">
                <p className="text-emerald-400 text-[7px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-1 md:mb-2">
                  Account Status
                </p>
                <div className="flex items-center gap-2 md:gap-3">
                  <div
                    className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-emerald-500 animate-ping shrink-0"
                    aria-hidden="true"
                  ></div>
                  <span className="text-white font-black uppercase tracking-widest text-[9px] md:text-sm">
                    Verified Partner
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
              <button
                onClick={() =>
                  navigate("/Supplier-Bid-List", { state: { mobile } })
                }
                className="flex-1 sm:flex-none px-3 sm:px-8 py-3 md:py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-xs transition-all flex items-center justify-center gap-2 md:gap-3 focus:ring-2 focus:ring-white/50"
              >
                <FaChartBar
                  className="text-emerald-400 text-[10px] md:text-base"
                  aria-hidden="true"
                />
                <span className="truncate">Intelligence</span>
              </button>
              <button
                onClick={() =>
                  navigate("/Supplier-Bid-List", { state: { mobile } })
                }
                className="flex-1 sm:flex-none px-3 sm:px-8 py-3 md:py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-xs transition-all shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2 md:gap-3 focus:ring-2 focus:ring-emerald-500"
              >
                <FaGavel
                  className="text-[10px] md:text-base"
                  aria-hidden="true"
                />
                <span className="truncate">Live Bidding</span>
              </button>
            </div>
          </footer>

          <PopupBox
            isOpen={showPopup}
            onClose={() => togglePopup(false)}
            title="Market Intelligence Alerts"
          >
            <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {confirmedBids.length > 0 ? (
                confirmedBids.map((notif, i) => (
                  <div
                    key={i}
                    className={`p-8 rounded-[2.2rem] mb-6 border-2 transition-all duration-500 cursor-pointer ${
                      notif.isRead
                        ? "bg-slate-50 border-slate-100"
                        : "bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-100"
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4
                        className={`font-black text-base uppercase tracking-tight ${notif.isRead ? "text-slate-600" : "text-emerald-800"}`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${notif.isRead ? "text-slate-500" : "text-emerald-800/80"} font-semibold`}
                    >
                      {notif.message}
                    </p>
                    <div className="mt-6 pt-6 border-t border-slate-200/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                          <FaBell className="text-[10px] text-emerald-600" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-200">
                    <FaBell className="text-4xl text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">
                    All intelligence up to date
                  </p>
                </div>
              )}
            </div>
          </PopupBox>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default SellerDashboard;
