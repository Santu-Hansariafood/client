import { Suspense, lazy, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGavel,
  FaBook,
  FaBoxOpen,
  FaChartLine,
  FaUserCircle,
  FaMapMarkerAlt,
  FaBuilding,
  FaWallet,
  FaWeightHanging,
  FaClock,
  FaArrowRight,
  FaSearch,
  FaPlus,
  FaHistory,
} from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import api from "../../utils/apiClient/apiClient";
import { toTitleCase } from "../../utils/textUtils/textUtils";
import { toast } from "react-toastify";

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, mobile } = useAuth();
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [buyerGroups, setBuyerGroups] = useState([]);
  const [stats, setStats] = useState({
    totalBrokerage: 0,
    totalUnloadingWeight: 0,
    totalSaudas: 0,
    pendingSaudas: 0,
    commodityBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAllConsignee, setShowAllConsignee] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!mobile) return;
      setLoading(true);
      try {
        const [statsRes, profileRes] = await Promise.all([
          api.get("/self-order/buyer/stats", { params: { mobile } }),
          api.get(`/buyers?mobile=${mobile}`),
        ]);

        setStats(statsRes.data);
        if (profileRes.data?.length > 0) {
          setBuyerProfile(profileRes.data[0]);
          setBuyerGroups(profileRes.data[0].groups || []);
        }
      } catch (error) {
        console.error("Error fetching buyer dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [mobile]);

  const quickActions = [
    {
      id: "live-bids",
      title: "Live Bids",
      icon: FaGavel,
      link: "/manage-bids/bid-list",
      color: "bg-emerald-500",
      description: "Active market bids",
    },
    {
      id: "create-bid",
      title: "New Bid",
      icon: FaPlus,
      link: "/manage-bids/buyer",
      color: "bg-blue-500",
      description: "Post a new requirement",
    },
    {
      id: "orders",
      title: "Orders",
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
      color: "bg-amber-500",
      description: "Track your sauda list",
    },
    {
      id: "history",
      title: "History",
      icon: FaHistory,
      link: "/buyer/bid-history",
      color: "bg-indigo-500",
      description: "Your past transactions",
    },
  ];

  const statCards = [
    {
      title: "Total Brokerage",
      value: `₹${stats.totalBrokerage.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: FaWallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Unloaded Wt.",
      value: `${stats.totalUnloadingWeight.toFixed(2)} T`,
      icon: FaWeightHanging,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Saudas",
      value: stats.pendingSaudas,
      icon: FaClock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-10">
      {/* App Header Section */}
      <div className="bg-slate-900 pt-8 pb-16 px-4 sm:px-6 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FaUserCircle className="text-3xl text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {toTitleCase(user?.name || "Buyer")}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  {buyerProfile?.companyName || "Verified Buyer"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/buyer/market-analytics")}
              className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <FaChartLine className="text-blue-400" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 space-y-6">
        {/* Stat Cards - Horizontal Scroll on Mobile */}
        <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className="min-w-[280px] sm:min-w-0 bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 group transition-all hover:scale-[1.02]"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center text-2xl transition-transform group-hover:rotate-12`}
              >
                <stat.icon />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.title}
                </p>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                  {stat.value}
                </h2>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.link)}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 text-left group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${action.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:rotate-12 transition-transform`}
                >
                  <action.icon size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-sm tracking-tight">
                  {action.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Two Column Layout for Groups & Commodities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Groups */}
          {buyerGroups.length > 0 && (
            <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FaBuilding size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Group Intelligence
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Quick filters for your units
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {buyerGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-indigo-200 transition-all"
                  >
                    <span className="font-bold text-slate-700">
                      {toTitleCase(group)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(
                            `/manage-bids/bid-list?group=${encodeURIComponent(group)}`,
                          )
                        }
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        Live
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/participate-bid-list?group=${encodeURIComponent(group)}`,
                          )
                        }
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        Participated
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Commodity Breakdown */}
          {stats.commodityBreakdown?.length > 0 && (
            <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FaChartLine size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Commodity Analysis
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Usage & Brokerage Distribution
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {stats.commodityBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        {item._id}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {item.quantity.toFixed(2)} Tons
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, (item.quantity / stats.totalUnloadingWeight) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>{item.trips} Shipments</span>
                      <span className="text-emerald-600">
                        ₹{item.brokerage.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Consignees Section */}
        {buyerProfile?.consignee?.length > 0 && (
          <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <FaMapMarkerAlt size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Active Consignees
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Your delivery destinations
                  </p>
                </div>
              </div>

              {buyerProfile.consignee.length > 4 && (
                <button
                  onClick={() => setShowAllConsignee(!showAllConsignee)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  {showAllConsignee ? "Show Less" : "View All"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(showAllConsignee
                ? buyerProfile.consignee
                : buyerProfile.consignee.slice(0, 4)
              ).map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:bg-white transition-all cursor-default group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaMapMarkerAlt size={12} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {c.label || c}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile App Navigation Simulation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex flex-col items-center gap-1 text-blue-600"
        >
          <FaUserCircle size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Home
          </span>
        </button>
        <button
          onClick={() => navigate("/manage-bids/bid-list")}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <FaSearch size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Bids
          </span>
        </button>
        <div className="relative -mt-10">
          <button
            onClick={() => navigate("/manage-bids/buyer")}
            className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform"
          >
            <FaPlus size={20} />
          </button>
        </div>
        <button
          onClick={() => navigate("/manage-order/list-self-order")}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <FaBoxOpen size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Orders
          </span>
        </button>
        <button
          onClick={() => navigate("/buyer/market-analytics")}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <FaChartLine size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Trends
          </span>
        </button>
      </div>
    </div>
  );
};

export default BuyerDashboard;
