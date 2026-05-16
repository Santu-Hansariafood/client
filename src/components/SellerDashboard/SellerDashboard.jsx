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
  FaBell,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";

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
                Brokerage: ₹{totalBrokerage.toLocaleString("en-IN")}
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

const CommodityItem = memo(({ item, totalQuantity }) => {
  const brokerage = item?.brokerage || 0;
  const quantity = item?.quantity || 0;
  const effectiveRate = useMemo(() => (brokerage / (quantity || 1)).toFixed(2), [brokerage, quantity]);
  const percentage = useMemo(() => Math.min((quantity / (totalQuantity || 1)) * 100, 100), [quantity, totalQuantity]);

  return (
    <div className="group relative bg-white hover:bg-slate-50/50 p-6 rounded-[2.2rem] border border-slate-100 hover:border-emerald-200/50 transition-all duration-700 hover:shadow-xl hover:shadow-slate-200/30">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all duration-700">
            <span className="text-xl font-black text-emerald-600 group-hover:text-white uppercase tracking-tighter italic transition-colors duration-700">
              {item?._id?.substring(0, 2) || "CM"}
            </span>
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-wider group-hover:text-emerald-700 transition-colors duration-500">
              {item?._id || "Other"}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <FaHistory className="text-[8px]" /> {item?.trips || 0} Trips
              </p>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verified</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 sm:gap-12 px-2">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">
              Volume x Rate
            </p>
            <div className="flex items-center justify-end gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">{quantity.toFixed(2)} T</span>
              <span className="text-slate-300 font-bold italic">×</span>
              <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">₹{effectiveRate}</span>
            </div>
          </div>
          <div className="text-right min-w-[140px] bg-slate-50 group-hover:bg-emerald-50 p-4 rounded-2xl border border-slate-100 group-hover:border-emerald-100 transition-all duration-700">
            <p className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-[0.25em] mb-1 transition-colors">
              Net Earnings
            </p>
            <p className="text-xl font-black text-slate-900 group-hover:text-emerald-700 tracking-tighter transition-colors">
              ₹{brokerage.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-tighter">
              ₹{effectiveRate}/T
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

CommodityItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    brokerage: PropTypes.number,
    quantity: PropTypes.number,
    trips: PropTypes.number,
  }),
  totalQuantity: PropTypes.number,
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
        <div className="p-4 sm:p-8 space-y-10 sm:space-y-14 max-w-[1600px] mx-auto">
          
          <HeaderSection userName={user?.name} totalBrokerage={totalBrokerage} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((item, i) => (
              <div key={i} className="hover:scale-[1.03] transition-transform duration-500">
                <Cards {...item} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-10 sm:space-y-14">
              
              {/* Performance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InsightCard 
                  title="Volume Intelligence"
                  subtitle="Consolidated Load"
                  value={totalQuantity.toFixed(2)}
                  unit="Tons"
                  icon={FaWeightHanging}
                  colorClass="bg-indigo-500"
                  footerText="Live Unloading Sync"
                />
                <InsightCard 
                  title="Financial Matrix"
                  subtitle="Brokerage Earnings"
                  value={`₹${Math.floor(totalBrokerage).toLocaleString("en-IN")}`}
                  unit={`.${(totalBrokerage % 1).toFixed(2).split(".")[1]}`}
                  icon={FaWallet}
                  colorClass="bg-emerald-500"
                  footerText="Consolidated Total"
                />
              </div>

              {/* Commodity Breakdown */}
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-8 sm:p-12">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-100">
                        <FaChartBar className="text-white text-lg" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                        Commodity Intelligence
                      </h3>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
                      Business performance breakdown by material
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-50 rounded-full border border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Analysis</span>
                  </div>
                </div>

                {commodityBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {commodityBreakdown.map((item, idx) => (
                      <CommodityItem key={item?._id || idx} item={item} totalQuantity={totalQuantity} />
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6 border border-slate-100">
                      <FaBoxOpen className="text-3xl text-slate-200" />
                    </div>
                    <h4 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-2">No Material Intelligence</h4>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] max-w-[240px] mx-auto leading-relaxed">
                      Your commodity performance breakdown will appear here once orders are processed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-10">
              {/* Quick Actions */}
              <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />
                
                <div className="relative z-10 flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FaGavel className="text-xl" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                    Navigation
                  </h3>
                </div>

                <div className="relative z-10 space-y-3">
                  {navigationItems.map((l, i) => (
                    <button
                      key={l.label || i}
                      onClick={() => (l.action ? l.action() : navigate(l.link, { state: l.state }))}
                      className="w-full flex items-center justify-between p-4.5 bg-slate-50 border border-slate-100/50 rounded-[1.8rem] hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-500 group/btn"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${l.color} border border-slate-100 group-hover/btn:scale-110 group-hover/btn:border-emerald-200 transition-all duration-500`}>
                          {l.isNotif ? (
                            <div className="relative">
                              {l.icon}
                              {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
                            </div>
                          ) : l.icon}
                        </div>
                        <span className="font-bold text-slate-700 text-[13px] tracking-wide group-hover/btn:text-emerald-700 group-hover/btn:translate-x-1 transition-all">
                          {l.label}
                        </span>
                      </div>
                      <FaChevronRight className="text-slate-300 group-hover/btn:text-emerald-500 transition-all group-hover/btn:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Card */}
              <div className="hover:scale-[1.02] transition-transform duration-500">
                <UserProfileCard user={user} />
              </div>

              {/* Info Widget */}
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FaBook size={80} />
                </div>
                <h4 className="text-lg font-black italic mb-2">Need Help?</h4>
                <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">Access documentation or contact support for any portal-related queries.</p>
                <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
                  Support Center
                </button>
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
