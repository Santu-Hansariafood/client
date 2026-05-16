import { useEffect, useState, lazy, Suspense } from "react";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaGavel, FaBoxOpen, FaChevronRight, FaBook } from "react-icons/fa";
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              {/* Performance Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 transition-all duration-500 hover:scale-[1.02]">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <FaBoxOpen className="text-white text-2xl" />
                      </div>
                      <h3 className="text-white/80 font-black text-xs uppercase tracking-[0.3em]">
                        Total Unloading Quantity
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                        {totalQuantity.toFixed(2)}
                      </span>
                      <span className="text-xl font-bold text-white/60">Tons</span>
                    </div>
                    <div className="mt-8 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        Live Unloading Status
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-200 transition-all duration-500 hover:scale-[1.02]">
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <FaBook className="text-white text-2xl" />
                      </div>
                      <h3 className="text-white/80 font-black text-xs uppercase tracking-[0.3em]">
                        Total Brokerage Earned
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                        ₹{totalBrokerage.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="mt-8 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        Consolidated Earnings
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
