import { useEffect, useState, lazy, Suspense, useMemo, memo, useCallback } from "react";
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

const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

// --- Sub-components ---

const HeaderSection = memo(({ userName, totalBrokerage }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="relative bg-white border border-emerald-100 rounded-[2rem] p-6 sm:p-8 shadow-sm overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50/30 skew-x-12 translate-x-1/4" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 ring-4 ring-emerald-50/50 p-2">
            <img src={logo} alt="Hansaria Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Hansaria Enterprise Portal</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter">
              {greeting}, <span className="text-emerald-600">Mr. {userName || "Partner"}</span>
            </h1>
            <p className="text-slate-500/60 text-sm font-semibold mt-1">Strategic intelligence and material logistics at your fingertips.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:border-l lg:border-emerald-100 lg:pl-10">
          <div className="bg-emerald-50/50 border border-emerald-100 px-8 py-5 rounded-[1.5rem] min-w-[200px] shadow-inner text-center">
            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1.5">Net Settlement</p>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-xs font-black text-emerald-600/40">Rs.</span>
              <span className="text-3xl font-black text-slate-800 tracking-tighter">
                {totalBrokerage.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
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

const StatCard = memo(({ title, value, unit, icon, colorClass, subtitle, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 transition-all duration-500 ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1' : ''}`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-inner ring-4 ring-white`}>
      <span className={`text-2xl ${colorClass.replace('bg-', 'text-')}`}>
        {typeof icon === 'function' ? icon({}) : icon}
      </span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-black text-slate-800 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString("en-IN") : value}
        </p>
        {unit && <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
      </div>
      {subtitle && <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">{subtitle}</p>}
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const CommodityItem = memo(({ item, totalQuantity, onAction, actionLabel }) => {
  const brokerage = item?.brokerage || 0;
  const quantity = item?.quantity || 0;
  const percentage = useMemo(() => Math.min((quantity / (totalQuantity || 1)) * 100, 100), [quantity, totalQuantity]);

  return (
    <div className="group relative bg-white hover:bg-emerald-50/30 p-5 rounded-[1.2rem] border border-slate-100 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-sm font-black tracking-tighter italic">
              {item?._id?.substring(0, 2) || "CM"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider truncate">
              {item?._id || "Other"}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FaHistory className="text-[8px]" /> {item?.trips || 0} Trips
              </p>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              {/* <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span> */}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-10 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tonnage</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-base font-black text-emerald-800">{quantity.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">T</span>
            </div>
          </div>
          
          <div className="text-right min-w-[100px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Earnings</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-[10px] font-black text-slate-400">Rs.</span>
              <span className="text-base font-black text-emerald-800">
                {brokerage.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {onAction && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAction(item?._id);
              }}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
              title={actionLabel || "Download Invoice"}
            >
              <FaDownload className="text-sm" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
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

  const navigationItems = useMemo(() => [
    { label: "Today's Bids", icon: <FaGavel />, color: "text-emerald-600", link: "/Supplier-Bid-List", state: { mobile }, count: sellerBidCount },
    { label: "Order History", icon: <FaBoxOpen />, color: "text-indigo-600", link: "/manage-order/list-self-order", state: { mobile }, count: orderCount },
    { label: "Pending Sauda", icon: <FaBook />, color: "text-amber-600", link: "/Loading-Entry/pending-loading-list", state: { mobile }, count: pendingSaudaCount },
    { label: "Loading List", icon: <FaHistory />, color: "text-blue-600", link: "/Loading-Entry/list-loading-entry", state: { mobile }, count: "Access" },
    { label: "Alerts", icon: <FaBell />, color: "text-purple-600", isNotif: true, action: () => togglePopup(true) },
  ], [mobile, togglePopup, sellerBidCount, orderCount, pendingSaudaCount]);

  useEffect(() => {
    let isMounted = true;

    if (!mobile) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
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
        setError("Unable to sync dashboard data. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [mobile]);

  if (loading) return <Loading />;
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/20 p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border border-emerald-100">
        <div className="h-24 w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <FaGavel size={40} />
        </div>
        <h2 className="text-3xl font-black text-emerald-800 italic uppercase tracking-tighter mb-4">Sync Error</h2>
        <p className="text-emerald-700/60 font-bold leading-relaxed">{error}</p>
        <button onClick={refreshDashboard} className="mt-8 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
          Retry Sync
        </button>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell noContentCard>
        <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-10 space-y-10 lg:space-y-14 max-w-[1700px] mx-auto">
          
          <HeaderSection userName={user?.name} totalBrokerage={totalBrokerage} />

          {/* Top Row: Classic Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {navigationItems.filter(item => !item.isNotif).map((item, idx) => (
              <StatCard
                key={idx}
                title={item.label}
                value={item.count}
                subtitle="View Records"
                icon={item.icon}
                colorClass={item.color.replace('text-', 'bg-')}
                onClick={() => navigate(item.link, { state: item.state })}
              />
            ))}
          </div>

          {/* Middle Row: Critical Intelligence Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
              value={commodityBreakdown.reduce((s, c) => s + (c.trips || 0), 0)} 
              icon={FaHistory} 
              colorClass="bg-amber-600" 
              subtitle="Aggregate Trips"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 sm:gap-12 items-start">
            {/* Material Intelligence */}
            <div className="xl:col-span-6 bg-white rounded-[2rem] border border-emerald-50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500">
              <div className="p-8 border-b border-emerald-50 bg-emerald-50/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <FaChartBar className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tight italic">Material <span className="text-emerald-600">Intelligence</span></h3>
                    <p className="text-[10px] font-black text-emerald-700/40 uppercase tracking-[0.3em]">Precision Commodity Breakdown</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-white px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">Sync Active</span>
              </div>
              <div className="p-8 space-y-4">
                {commodityBreakdown.length > 0 ? (
                  commodityBreakdown.map((item, idx) => (
                    <CommodityItem key={item?._id || idx} item={item} totalQuantity={totalQuantity} />
                  ))
                ) : (
                  <div className="py-24 text-center">
                    <FaBoxOpen className="text-5xl text-emerald-100 mx-auto mb-6" />
                    <p className="text-emerald-800/40 font-black uppercase tracking-[0.2em] text-xs">No intelligence data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Performance */}
            <div className="xl:col-span-6 bg-white rounded-[2rem] border border-indigo-50 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-500">
              <div className="p-8 border-b border-indigo-50 bg-indigo-50/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <FaChartBar className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-indigo-800 uppercase tracking-tight italic">Company <span className="text-indigo-600">Performance</span></h3>
                    <p className="text-[10px] font-black text-indigo-700/40 uppercase tracking-[0.3em]">Entity Wise Revenue Insights</p>
                  </div>
                </div>
                <button 
                  onClick={() => togglePopup(true)}
                  className="text-[10px] font-black text-indigo-600 bg-white px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                >
                  View Alerts
                </button>
              </div>
              <div className="p-8 space-y-4">
                {companyBreakdown.length > 0 ? (
                  companyBreakdown.map((item, idx) => (
                    <CommodityItem 
                      key={item?._id || idx} 
                      item={item} 
                      totalQuantity={totalQuantity} 
                      onAction={handleDownloadInvoice}
                      actionLabel="Download Proforma Invoice"
                    />
                  ))
                ) : (
                  <div className="py-24 text-center">
                    <FaBoxOpen className="text-5xl text-indigo-100 mx-auto mb-6" />
                    <p className="text-indigo-800/40 font-black uppercase tracking-[0.2em] text-xs">No performance data captured</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Footer Bar */}
          <div className="bg-emerald-800 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-200 flex flex-wrap items-center justify-between gap-10">
            <div className="flex items-center gap-12">
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em] mb-2">Aggregate Logistics</p>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {commodityBreakdown.reduce((s, c) => s + (c.trips || 0), 0)} 
                  <span className="text-sm font-bold text-emerald-400 ml-2 uppercase tracking-widest italic">Total Trips</span>
                </p>
              </div>
              <div className="h-16 w-px bg-emerald-700 hidden lg:block" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em] mb-2">Market Participation</p>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {participateBidCount} 
                  <span className="text-sm font-bold text-emerald-400 ml-2 uppercase tracking-widest italic">Active Bids</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mr-4 hidden xl:block">System Navigation</p>
              {navigationItems.filter(i => i.isNotif).map((l, i) => (
                <button
                  key={l.label || i}
                  onClick={() => l.action()}
                  className="px-8 py-4 bg-white text-emerald-800 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-100 transition-all flex items-center gap-4 shadow-xl ring-4 ring-emerald-700/50"
                >
                  <span className="text-lg">{l.icon}</span>
                  {l.label}
                  {notificationCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] rounded-full animate-bounce">
                      {notificationCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Popup */}
          <PopupBox isOpen={showPopup} onClose={() => togglePopup(false)} title="Market Intelligence Alerts">
            <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {confirmedBids.length > 0 ? (
                confirmedBids.map((notif, i) => (
                  <div
                    key={i}
                    className={`p-8 rounded-[2.2rem] mb-6 border-2 transition-all duration-500 cursor-pointer ${
                      notif.isRead ? "bg-slate-50 border-slate-100" : "bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-100"
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className={`font-black text-base uppercase tracking-tight ${notif.isRead ? "text-slate-600" : "text-emerald-800"}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && <span className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />}
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.isRead ? "text-slate-500" : "text-emerald-800/80"} font-semibold`}>
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
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-200">
                    <FaBell className="text-4xl text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">All intelligence up to date</p>
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
