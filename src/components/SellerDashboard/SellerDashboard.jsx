import { useEffect, useState, lazy, Suspense, useMemo, memo, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  FaGavel,
  FaBoxOpen,
  FaChevronRight,
  FaBook,
  FaChartBar,
  FaWeightHanging,
  FaWallet,
  FaHistory,
  FaDownload,
  FaBell,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";
import { pdf } from "@react-pdf/renderer";
import ProformaInvoicePDF from "./ProformaInvoicePDF";
import { downloadFile } from "../../utils/fileDownloader";

const Cards = lazy(() => import("../../common/Cards/Cards"));
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const HeaderSection = memo(({ userName, totalBrokerage }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-emerald-600 to-teal-700 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl text-white gap-6">
      {/* Glow Effects */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]" />
          <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em]">
            Seller Intelligence Dashboard
          </p>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight italic">
            {greeting}, <span className="text-white">Mr. {userName || "Partner"}</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
              <FaWallet className="text-[10px]" />
              <p className="text-xs font-black tracking-tight">
                Brokerage: Rs. {totalBrokerage.toLocaleString("en-IN")}
              </p>
            </div>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <p className="text-emerald-50 text-[10px] font-bold uppercase tracking-widest opacity-80">
              Verified Seller Account
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-5 bg-white/10 backdrop-blur-2xl p-5 rounded-[2.2rem] border border-white/20 shadow-xl group hover:bg-white/20 transition-all duration-500">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
          <img src="/icons/favicon-32x32.png" alt="logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="text-left pr-4">
          <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest leading-tight">
            Enterprise Partner
          </p>
          <p className="text-sm font-black text-white tracking-tight mt-0.5">
            Hansaria Food Pvt Ltd
          </p>
        </div>
      </div>
    </div>
  );
});
HeaderSection.displayName = 'HeaderSection';

HeaderSection.propTypes = {
  userName: PropTypes.string,
  totalBrokerage: PropTypes.number,
};

// eslint-disable-next-line react/display-name
const InsightCard = memo(({ title, subtitle, value, unit, icon: Icon, colorClass, footerText }) => (
  <div className="relative group overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98]">
    <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity duration-700 ${colorClass}`} />
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-emerald-200 group-hover:shadow-lg group-hover:shadow-emerald-100/50 transition-all duration-700">
          {Icon && <Icon className="text-slate-600 group-hover:text-emerald-600 text-2xl transition-colors duration-700" />}
        </div>
        <div>
          <h3 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.3em]">
            {title}
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-700 transition-colors duration-700">
          {value || 0}
        </span>
        {unit && <span className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">{unit}</span>}
      </div>
      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {footerText}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700">
          <FaChevronRight className="text-slate-300 text-xs group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  </div>
));

InsightCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  icon: PropTypes.elementType,
  colorClass: PropTypes.string,
  footerText: PropTypes.string,
};

const CommodityItem = memo(({ item, totalQuantity, onAction, actionLabel }) => {
  const brokerage = item?.brokerage || 0;
  const quantity = item?.quantity || 0;
  const effectiveRate = useMemo(() => (brokerage / (quantity || 1)).toFixed(2), [brokerage, quantity]);
  const percentage = useMemo(() => Math.min((quantity / (totalQuantity || 1)) * 100, 100), [quantity, totalQuantity]);

  return (
    <div className="group relative bg-white hover:bg-slate-50/50 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200/50 transition-all duration-700 hover:shadow-xl hover:shadow-slate-200/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-[1.5rem] sm:rounded-[1.8rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all duration-700">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 group-hover:text-white uppercase tracking-tighter italic transition-colors duration-700">
              {item?._id?.substring(0, 2) || "CM"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider group-hover:text-emerald-700 transition-colors duration-500 truncate">
              {item?._id || "Other"}
            </h4>
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5">
              <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                <FaHistory className="text-[8px] sm:text-[10px]" /> {item?.trips || 0} Trips
              </p>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <p className="text-[10px] sm:text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Verified</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 sm:gap-10 lg:gap-14">
          <div className="text-left md:text-right">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">
              Volume x Rate
            </p>
            <div className="flex items-center md:justify-end gap-2">
              <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight">{quantity.toFixed(2)} T</span>
              <span className="text-slate-300 font-bold italic">×</span>
              <span className="text-sm sm:text-base font-black text-indigo-600 bg-indigo-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-indigo-100/50">₹{effectiveRate}</span>
            </div>
          </div>
          
          <div className="text-right min-w-[120px] sm:min-w-[160px] bg-slate-50 group-hover:bg-emerald-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 group-hover:border-emerald-100 transition-all duration-700">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-[0.25em] mb-1 sm:mb-1.5 transition-colors">
              Net Earnings
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-emerald-700 tracking-tighter transition-colors">
              Rs. {brokerage.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-indigo-600 mt-1 uppercase tracking-tighter">
              Rs. {effectiveRate}/T
            </p>
          </div>

          {onAction && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAction(item?._id);
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 hover:scale-110 transition-all duration-300"
              title={actionLabel || "Download Invoice"}
            >
              <FaDownload className="text-lg sm:text-xl" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mt-10 h-2 sm:h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

CommodityItem.displayName = 'CommodityItem';

CommodityItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    brokerage: PropTypes.number,
    quantity: PropTypes.number,
    trips: PropTypes.number,
  }),
  totalQuantity: PropTypes.number,
  onAction: PropTypes.func,
  actionLabel: PropTypes.string,
};

// --- Main Dashboard Component ---

const SellerDashboard = () => {
  const { mobile, user } = useAuth();
  const {
    notifications: confirmedBids,
    unreadCount: notificationCount,
    markAsRead,
  } = useNotifications();
  const navigate = useNavigate();

  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sellerBidCount, setSellerBidCount] = useState(0);
  const [participateBidCount, setParticipateBidCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingSaudaCount, setPendingSaudaCount] = useState(0);
  const [totalBrokerage, setTotalBrokerage] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [commodityBreakdown, setCommodityBreakdown] = useState([]);
  const [companyBreakdown, setCompanyBreakdown] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const handleNotificationClick = useCallback(async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
  }, [markAsRead]);

  const togglePopup = useCallback((val) => setShowPopup(val), []);
  const refreshDashboard = useCallback(() => window.location.reload(), []);

  const handleDownloadInvoice = useCallback(async (companyName) => {
    if (!companyName || !mobile) return;
    
    const toastId = toast.loading(`Generating invoice for ${companyName}...`);
    try {
      const { data } = await api.get(`/loading-entries/company-report`, {
        params: { supplierCompany: companyName, mobile }
      });

      if (!data.entries || data.entries.length === 0) {
        toast.update(toastId, {
          render: "No unloading data found for this company.",
          type: "info",
          isLoading: false,
          autoClose: 3000
        });
        return;
      }

      const blob = await pdf(
        <ProformaInvoicePDF 
          entries={data.entries} 
          company={data.company} 
        />
      ).toBlob();

      downloadFile(blob, `Proforma_Invoice_${companyName.replace(/\s+/g, '_')}.pdf`);
      
      toast.update(toastId, {
        render: "Invoice generated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
    } catch (err) {
      console.error("Invoice Generation Error:", err);
      toast.update(toastId, {
        render: "Failed to generate invoice. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  }, [mobile]);

  // Memoize navigation items to prevent object reference changes on every render
  const navigationItems = useMemo(() => [
    { label: "Today's Active Bids", icon: <FaGavel />, color: "text-emerald-400", link: "/Supplier-Bid-List", state: { mobile } },
    { label: "Order History", icon: <FaBoxOpen />, color: "text-blue-400", link: "/manage-order/list-self-order", state: { mobile } },
    { label: "Pending Sauda List", icon: <FaBook />, color: "text-orange-400", link: "/Loading-Entry/pending-loading-list", state: { mobile } },
    { label: "Loading Entries", icon: <FaHistory />, color: "text-indigo-400", link: "/Loading-Entry/list-loading-entry", state: { mobile } },
    { label: "Notifications", icon: <FaBell />, color: "text-purple-400", isNotif: true, action: () => togglePopup(true) },
  ], [mobile, togglePopup]);

  useEffect(() => {
    let isMounted = true;

    if (!mobile) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }

    const fetchSellerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sellersRes, bidsRes, participateRes, ordersRes, pendingRes, statsRes] =
          await Promise.all([
            api.get(`/sellers?mobile=${mobile}`),
            api.get("/bids?status=active"),
            api.get(`/participatebids?mobile=${mobile}&limit=1`),
            api.get(`/self-order?sellerMobile=${mobile}&limit=1&page=1&userRole=Seller`),
            api.get(`/self-order/pending/list?mobile=${mobile}&userRole=Seller&limit=1&page=1`),
            api.get(`/self-order/seller/stats?mobile=${mobile}`),
          ]);

        if (!isMounted) return;

        const normalizePhone = (p) => {
          const m = String(p || "").trim().match(/^(?:\+91|0)?([6-9]\d{9})$/);
          return m ? m[1] : p;
        };

        const sellers = sellersRes?.data || [];
        const bids = bidsRes?.data?.data || bidsRes?.data || [];

        const seller = sellers.find((s) =>
          s?.phoneNumbers?.some((p) => normalizePhone(p?.value) === normalizePhone(mobile))
        );

        if (!seller) {
          setError("No seller profile found. Please contact support.");
          return;
        }

        setSellerDetails(seller);

        const activeSellerBids = bids.filter(
          (bid) =>
            bid.status === "active" &&
            seller?.commodities?.some((c) => c?.name === bid?.commodity)
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
        console.error("Dashboard Sync Error:", err);
        const errorMessage = err.response?.data?.message || "Network synchronization failed";
        toast.error(errorMessage);
        setError("Unable to sync dashboard data. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSellerDetails();

    return () => {
      isMounted = false;
    };
  }, [mobile]);

  const stats = useMemo(() => [
    {
      title: "Today's Bids",
      count: sellerBidCount,
      icon: FaGavel,
      link: "/Supplier-Bid-List",
      color: "from-emerald-400 to-green-600",
      state: sellerDetails ? { commodities: sellerDetails.commodities?.map((c) => c._id), mobile } : {},
    },
    {
      title: "Active Orders",
      count: orderCount,
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
      color: "from-blue-400 to-indigo-600",
      state: { mobile },
    },
    {
      title: "Pending Sauda",
      count: pendingSaudaCount,
      icon: FaBook,
      link: "/Loading-Entry/pending-loading-list",
      color: "from-orange-400 to-amber-500",
      state: { mobile },
    },
    {
      title: "Participated",
      count: participateBidCount,
      icon: FaHistory,
      link: "/participate-bid-list",
      color: "from-purple-400 to-violet-600",
      state: { mobile },
    },
  ], [sellerBidCount, orderCount, pendingSaudaCount, participateBidCount, sellerDetails, mobile]);

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border border-slate-100">
        <div className="h-24 w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <FaGavel size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Sync Error</h2>
        <p className="text-slate-500 font-bold leading-relaxed">{error}</p>
        <button onClick={refreshDashboard} className="mt-8 px-10 py-4 bg-[#020617] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
          Retry Sync
        </button>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell noContentCard>
        <div className="p-4 sm:p-8 space-y-8 sm:space-y-12 max-w-[1600px] mx-auto bg-[#f8fafc]">
          
          <HeaderSection userName={user?.name} totalBrokerage={totalBrokerage} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((item, i) => (
              <div key={i} className="hover:-translate-y-1 transition-all duration-300">
                <Cards {...item} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 sm:gap-10">
            {/* Main Content Area */}
            <div className="xl:col-span-9 space-y-8 sm:space-y-12">
              
              {/* Performance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <FaWeightHanging className="text-2xl" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Volume Intelligence</p>
                      <h4 className="text-lg font-black text-slate-900 uppercase italic">Consolidated Load</h4>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{totalQuantity.toFixed(2)}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Tons</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Live Sync</span>
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <FaWallet className="text-2xl" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Financial Matrix</p>
                      <h4 className="text-lg font-black text-slate-900 uppercase italic">Brokerage Earnings</h4>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-400 mr-1">Rs.</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{Math.floor(totalBrokerage).toLocaleString("en-IN")}</span>
                    <span className="text-lg font-bold text-slate-400">.{(totalBrokerage % 1).toFixed(2).split(".")[1]}</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Verified</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Settled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commodity Breakdown */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 sm:p-10">
                <div className="flex items-center justify-between mb-10 pb-6 border-bottom border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <FaChartBar className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                        Material <span className="text-emerald-600">Intelligence</span>
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                        Performance analysis by commodity
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                </div>

                {commodityBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {commodityBreakdown.map((item, idx) => (
                      <CommodityItem key={item?._id || idx} item={item} totalQuantity={totalQuantity} />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                    <FaBoxOpen className="text-4xl text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No intelligence data available</p>
                  </div>
                )}
              </div>

              {/* Company Breakdown Section */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 sm:p-10">
                <div className="flex items-center gap-4 mb-10 pb-6 border-bottom border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <FaChartBar className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                      Company <span className="text-indigo-600">Performance</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Revenue breakdown by business entity
                    </p>
                  </div>
                </div>

                {companyBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {companyBreakdown.map((item, idx) => (
                      <CommodityItem 
                        key={item?._id || idx} 
                        item={item} 
                        totalQuantity={totalQuantity} 
                        onAction={handleDownloadInvoice}
                        actionLabel="Download Proforma Invoice"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                    <FaBoxOpen className="text-4xl text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No company performance data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="xl:col-span-3">
              <div className="sticky top-8 space-y-8">
                {/* Navigation Actions */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <FaGavel className="text-lg" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">
                      Quick <span className="text-emerald-600">Links</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {navigationItems.map((l, i) => (
                      <button
                        key={l.label || i}
                        onClick={() => (l.action ? l.action() : navigate(l.link, { state: l.state }))}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-emerald-100 border border-transparent rounded-2xl transition-all duration-300 group/btn"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${l.color} shadow-sm group-hover/btn:scale-110 transition-transform`}>
                            {l.isNotif ? (
                              <div className="relative">
                                {l.icon}
                                {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                              </div>
                            ) : l.icon}
                          </div>
                          <span className="font-bold text-slate-600 text-xs tracking-wide group-hover/btn:text-slate-900">
                            {l.label}
                          </span>
                        </div>
                        <FaChevronRight className="text-slate-300 text-[10px] group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications Preview */}
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 overflow-hidden relative group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <FaBell size={100} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-lg font-black italic mb-4">Latest Updates</h4>
                    <div className="space-y-4">
                      {confirmedBids.slice(0, 2).map((notif, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">{notif.title}</p>
                          <p className="text-[11px] text-white/70 line-clamp-2">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => togglePopup(true)}
                      className="w-full mt-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                    >
                      View All Alerts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <PopupBox isOpen={showPopup} onClose={() => togglePopup(false)} title="Intelligence Notifications">
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {confirmedBids.length > 0 ? (
                confirmedBids.map((notif, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-[1.8rem] mb-4 border transition-all duration-300 cursor-pointer ${
                      notif.isRead ? "bg-slate-50 border-slate-100" : "bg-emerald-50 border-emerald-100 shadow-sm"
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-black text-sm uppercase tracking-tight ${notif.isRead ? "text-slate-700" : "text-emerald-800"}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{notif.message}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center justify-between">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <FaBell className="text-4xl text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No unread alerts</p>
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
