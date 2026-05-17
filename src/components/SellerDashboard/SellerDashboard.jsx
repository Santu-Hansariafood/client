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
    <div className="relative bg-white border border-slate-200/60 rounded-[1.5rem] p-6 sm:p-8 shadow-sm overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-50/50 -skew-x-12 translate-x-1/2 group-hover:bg-emerald-100/50 transition-colors duration-700" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 ring-4 ring-emerald-50">
            <img src="/icons/favicon-32x32.png" alt="logo" className="w-10 h-10 object-contain brightness-0 invert" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enterprise Seller Portal</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {greeting}, <span className="text-emerald-600">Mr. {userName || "Partner"}</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Manage your commodities and performance intelligence in real-time.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:border-l lg:border-slate-100 lg:pl-10">
          <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl min-w-[180px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Brokerage</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-slate-400">Rs.</span>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                {totalBrokerage.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <FaGavel className="text-[10px]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Account</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-tighter">Last Sync: Just Now</p>
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

const StatCard = memo(({ title, value, unit, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow duration-300">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10`}>
      <Icon className={`text-xl ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
      <p className="text-xl font-black text-slate-900">
        {typeof value === 'number' ? value.toLocaleString("en-IN") : value} 
        {unit && <span className="text-[10px] font-bold text-slate-400 ml-1">{unit}</span>}
      </p>
      {subtitle && <p className="text-[9px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const CommodityItem = memo(({ item, totalQuantity, onAction, actionLabel }) => {
  const brokerage = item?.brokerage || 0;
  const quantity = item?.quantity || 0;
  const percentage = useMemo(() => Math.min((quantity / (totalQuantity || 1)) * 100, 100), [quantity, totalQuantity]);

  return (
    <div className="group relative bg-white hover:bg-slate-50 p-5 rounded-[1.2rem] border border-slate-200/60 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-sm font-black tracking-tighter italic">
              {item?._id?.substring(0, 2) || "CM"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider truncate">
              {item?._id || "Other"}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FaHistory className="text-[8px]" /> {item?.trips || 0} Trips
              </p>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-10 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tonnage</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-base font-black text-slate-900">{quantity.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">T</span>
            </div>
          </div>
          
          <div className="text-right min-w-[100px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Earnings</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-[10px] font-black text-slate-400">Rs.</span>
              <span className="text-base font-black text-slate-900">
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
    { label: "Today's Bids", icon: <FaGavel />, color: "text-emerald-500", link: "/Supplier-Bid-List", state: { mobile } },
    { label: "Order History", icon: <FaBoxOpen />, color: "text-blue-500", link: "/manage-order/list-self-order", state: { mobile } },
    { label: "Pending Sauda", icon: <FaBook />, color: "text-orange-500", link: "/Loading-Entry/pending-loading-list", state: { mobile } },
    { label: "Loading List", icon: <FaHistory />, color: "text-indigo-500", link: "/Loading-Entry/list-loading-entry", state: { mobile } },
    { label: "Alerts", icon: <FaBell />, color: "text-purple-500", isNotif: true, action: () => togglePopup(true) },
  ], [mobile, togglePopup]);

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
        <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          
          <HeaderSection userName={user?.name} totalBrokerage={totalBrokerage} />

          {/* Primary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              title="Total Volume" 
              value={totalQuantity.toFixed(2)} 
              unit="T" 
              icon={FaWeightHanging} 
              colorClass="bg-indigo-500" 
              subtitle="Consolidated"
            />
            <StatCard 
              title="Net Earnings" 
              value={`Rs. ${Math.floor(totalBrokerage).toLocaleString("en-IN")}`} 
              icon={FaWallet} 
              colorClass="bg-emerald-500" 
              subtitle="Total Brokerage"
            />
            <StatCard 
              title="Active Saudas" 
              value={pendingSaudaCount} 
              icon={FaBoxOpen} 
              colorClass="bg-amber-500" 
              subtitle="Pending Loading"
            />
            <StatCard 
              title="Total Bids" 
              value={sellerBidCount} 
              icon={FaGavel} 
              colorClass="bg-slate-900" 
              subtitle="Live Market"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Material Intelligence */}
            <div className="xl:col-span-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                    <FaChartBar className="text-sm" />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Material <span className="text-emerald-600">Intelligence</span></h3>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Real-time</span>
              </div>
              <div className="p-6 space-y-3">
                {commodityBreakdown.length > 0 ? (
                  commodityBreakdown.map((item, idx) => (
                    <CommodityItem key={item?._id || idx} item={item} totalQuantity={totalQuantity} />
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <FaBoxOpen className="text-4xl text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No intelligence data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Performance */}
            <div className="xl:col-span-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <FaChartBar className="text-sm" />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Company <span className="text-indigo-600">Performance</span></h3>
                </div>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Active</span>
              </div>
              <div className="p-6 space-y-3">
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
                  <div className="py-20 text-center">
                    <FaBoxOpen className="text-4xl text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No company performance data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Footer Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Trips</p>
                <p className="text-lg font-black text-slate-900">{commodityBreakdown.reduce((s, c) => s + (c.trips || 0), 0)} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Trips</span></p>
              </div>
              <div className="h-10 w-px bg-slate-100 hidden sm:block" />
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Participated</p>
                <p className="text-lg font-black text-slate-900">{participateBidCount} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Bids</span></p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {navigationItems.map((l, i) => (
                <button
                  key={l.label || i}
                  onClick={() => (l.action ? l.action() : navigate(l.link, { state: l.state }))}
                  className="px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-lg shadow-slate-200"
                >
                  <span className={l.color}>{l.icon}</span>
                  {l.label}
                  {l.isNotif && notificationCount > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Popup */}
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
