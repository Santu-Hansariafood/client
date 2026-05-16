import { useEffect, useState, lazy, Suspense } from "react";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaGavel, FaBoxOpen, FaChevronRight, FaBook, FaChartBar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";

const Cards = lazy(() => import("../../common/Cards/Cards"));
const Loading = lazy(() => import("../../common/Loading/Loading"));
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

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

  useEffect(() => {
    if (!mobile) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }

    const fetchSellerDetails = async () => {
      try {
        setLoading(true);

        const [sellersRes, bidsRes, participateRes, ordersRes, pendingRes, statsRes] =
          await Promise.all([
            api.get(`/sellers?mobile=${mobile}`),
            api.get("/bids?status=active"),
            api.get(`/participatebids?mobile=${mobile}&limit=1`),
            api.get(
              `/self-order?sellerMobile=${mobile}&limit=1&page=1&userRole=Seller`,
            ),
            api.get(
              `/self-order/pending/list?mobile=${mobile}&userRole=Seller&limit=1&page=1`,
            ),
            api.get(`/self-order/seller/stats?mobile=${mobile}`),
          ]);

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
          setError("No seller found.");
          return;
        }

        setSellerDetails(seller);

        const activeSellerBids = bids.filter(
          (bid) =>
            bid.status === "active" &&
            seller?.commodities?.some((c) => c?.name === bid?.commodity),
        );

        setSellerBidCount(activeSellerBids.length);

        // Get totals from response
        const participateTotal =
          participateRes?.data?.total || participateRes?.data?.length || 0;
        const ordersTotal =
          ordersRes?.data?.total || ordersRes?.data?.length || 0;
        const pendingTotal =
          pendingRes?.data?.total || pendingRes?.data?.length || 0;

        setParticipateBidCount(participateTotal);
        setOrderCount(ordersTotal);
        setPendingSaudaCount(pendingTotal);
        setTotalBrokerage(statsRes.data?.totalBrokerage || 0);
        setTotalQuantity(statsRes.data?.totalUnloadingWeight || 0);
        setCommodityBreakdown(statsRes.data?.commodityBreakdown || []);
      } catch (err) {
        console.error(err);
        toast.error("Error loading dashboard");
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerDetails();
  }, [mobile]);

  const dashboardData = [
    {
      title: "Today's Bids",
      count: sellerBidCount,
      icon: FaGavel,
      link: "/Supplier-Bid-List",
      color: "from-emerald-400 to-green-600",
      state: sellerDetails
        ? {
            commodities: sellerDetails.commodities?.map((c) => c._id),
            mobile,
          }
        : {},
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
      title: "Participate",
      count: participateBidCount,
      icon: FaGavel,
      link: "/participate-bid-list",
      color: "from-purple-400 to-violet-600",
      state: { mobile },
    },
    {
      title: "Total Brokerage",
      count: `₹${totalBrokerage.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: FaBook,
      link: "/manage-order/list-self-order",
      color: "from-indigo-400 to-blue-600",
      state: { mobile },
    },
  ];

  if (loading) return <Loading />;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell noContentCard>
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-3 sm:p-6 space-y-6 sm:y-8">
          <div className="relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-br from-emerald-500 to-green-600 p-6 sm:p-8 rounded-[2rem] sm:rounded-3xl shadow-xl text-white gap-4">
            <div className="relative z-10">
              <h1 className="text-xl sm:text-3xl font-bold">
                Welcome, Mr. {user?.name}
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                Manage your business intelligence efficiently
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <img
                    src="/icons/favicon-32x32.png"
                    alt="logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>

                <div className="text-xs">
                  <p className="font-bold text-white uppercase tracking-wider">
                    Verified Seller
                  </p>
                  <p className="text-emerald-200 font-medium">
                    Trusted Partner Account
                  </p>
                </div>
              </div>
            </div>

            {/* Background Decorative Circles */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {dashboardData.map((item, i) => (
              <div
                key={i}
                className="bg-white p-1 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <Cards {...item} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Performance Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group overflow-hidden bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <FaBoxOpen className="text-indigo-400 text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">
                          Volume Intelligence
                        </h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                          Consolidated Load
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {totalQuantity.toFixed(2)}
                      </span>
                      <span className="text-lg font-black text-slate-500 uppercase tracking-widest">
                        Tons
                      </span>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Real-time Sync
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.2em]">
                        Total Unloading
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:shadow-emerald-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <FaBook className="text-emerald-400 text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em]">
                          Financial Matrix
                        </h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                          Brokerage Earnings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-emerald-500/60 tracking-tight mr-1">
                        ₹
                      </span>
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {totalBrokerage.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-lg font-black text-slate-500 uppercase tracking-widest ml-2">
                        .{(totalBrokerage % 1).toFixed(2).split(".")[1]}
                      </span>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Verified
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.2em]">
                        Accumulated
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commodity-wise Breakdown Section */}
              {commodityBreakdown.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
                        Commodity Intelligence
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
                        Performance breakdown by material
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <FaChartBar />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {commodityBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-slate-50/50 hover:bg-white p-6 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/40"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                              <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                                {item._id?.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-base font-black text-slate-800 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                                {item._id || "Other"}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {item.trips} Total Trips
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-12 px-2">
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                Quantity
                              </p>
                              <p className="text-lg font-black text-slate-800 tracking-tight">
                                {item.quantity.toFixed(2)}{" "}
                                <span className="text-[10px] text-slate-400 uppercase">
                                  Tons
                                </span>
                              </p>
                            </div>
                            <div className="text-right min-w-[120px]">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">
                                Earnings
                              </p>
                              <p className="text-lg font-black text-emerald-600 tracking-tight">
                                ₹{item.brokerage.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-6 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full group-hover:opacity-100 transition-all duration-700"
                            style={{
                              width: `${Math.min((item.quantity / totalQuantity) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/70 backdrop-blur-xl p-4 sm:p-8 rounded-[2rem] sm:rounded-3xl shadow-sm border border-white/60">
                <UserProfileCard user={user} />
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] sm:rounded-3xl shadow-sm border border-white/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <FaChevronRight className="rotate-90" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Quick Actions
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Today's Active Bids",
                    icon: <FaGavel className="text-emerald-500" />,
                    action: () =>
                      navigate("/Supplier-Bid-List", { state: { mobile } }),
                  },
                  {
                    label: "Order History",
                    icon: <FaBoxOpen className="text-blue-500" />,
                    action: () =>
                      navigate("/manage-order/list-self-order", {
                        state: { mobile },
                      }),
                  },
                  {
                    label: "Pending Sauda List",
                    icon: <FaBook className="text-orange-500" />,
                    action: () =>
                      navigate("/Loading-Entry/pending-loading-list", {
                        state: { mobile },
                      }),
                  },
                  {
                    label: "Loading Entries",
                    icon: <FaBook className="text-indigo-500" />,
                    action: () =>
                      navigate("/Loading-Entry/list-loading-entry", {
                        state: { mobile },
                      }),
                  },
                  {
                    label: "Notifications",
                    icon: (
                      <div className="relative">
                        <FaChevronRight className="text-slate-400" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                    ),
                    action: () => setShowPopup(true),
                  },
                ].map((l, i) => (
                  <button
                    key={i}
                    onClick={() => (l.action ? l.action() : navigate(l.link))}
                    className="w-full flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                        {l.icon}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">
                        {l.label}
                      </span>
                    </div>
                    <FaChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <PopupBox
            isOpen={showPopup}
            onClose={() => setShowPopup(false)}
            title="Notifications"
          >
            {confirmedBids.length > 0 ? (
              confirmedBids.map((notif, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl mb-2 border ${
                    notif.isRead
                      ? "bg-slate-50 border-slate-100"
                      : "bg-emerald-50 border-emerald-100"
                  }`}
                  onClick={async () => {
                    if (!notif.isRead) {
                      await markAsRead(notif._id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h4
                      className={`font-bold ${notif.isRead ? "text-slate-700" : "text-emerald-800"}`}
                    >
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">
                No notifications
              </p>
            )}
          </PopupBox>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default SellerDashboard;
