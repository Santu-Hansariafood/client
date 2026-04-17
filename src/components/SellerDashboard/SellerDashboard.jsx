import { useEffect, useState, lazy, Suspense } from "react";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  FaGavel,
  FaBoxOpen,
  FaChevronRight,
  FaBook,
} from "react-icons/fa";
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
  const [saudaCount, setSaudaCount] = useState(0);
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

        const [sellersRes, bidsRes, participateRes, ordersRes] =
          await Promise.all([
            api.get(`/sellers?mobile=${mobile}`),
            api.get("/bids?status=active"),
            api.get(`/participatebids?mobile=${mobile}`),
            api.get(`/self-order?sellerMobile=${mobile}`),
          ]);

        const normalizePhone = (p) => {
          const m = String(p || "")
            .trim()
            .match(/^(?:\+91|0)?([6-9]\d{9})$/);
          return m ? m[1] : p;
        };

        const sellers = sellersRes?.data || [];
        const bids = bidsRes?.data?.data || bidsRes?.data || [];
        const participate =
          participateRes?.data?.data || participateRes?.data || [];
        const orders = ordersRes?.data?.data || ordersRes?.data || [];

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

        setParticipateBidCount(participate.length);

        setOrderCount(orders.length);
        setSaudaCount(orders.length);
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
      title: "todays Buying",
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
      title: "Orders",
      count: orderCount,
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
      color: "from-blue-400 to-indigo-600",
    },
    {
      title: "Sauda Book",
      count: saudaCount,
      icon: FaBook,
      link: "/sodabook/list",
      color: "from-orange-400 to-amber-500",
    },
    {
      title: "Participate",
      count: participateBidCount,
      icon: FaGavel,
      link: "/participate-bid-list",
      color: "from-purple-400 to-violet-600",
    },
  ];

  if (loading) return <Loading />;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell noContentCard>
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 sm:p-6 space-y-8">
          <div className="relative overflow-hidden flex justify-between items-center bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-3xl shadow-xl text-white">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome, Mr. {user?.name}
              </h1>
              <p className="text-emerald-100 text-sm">
                Manage your business efficiently
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/favicon-16x16.png"
                  alt="logo"
                  className="w-4 h-4 rounded-xl shadow"
                />

                <div className="text-xs sm:text-sm">
                  <p className="font-semibold">Verified Seller</p>
                  <p className="text-emerald-100 text-[10px]">
                    Trusted Account
                  </p>
                </div>
              </div>
              
            </div>
          </div>{" "}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dashboardData.map((item, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <Cards {...item} />
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow">
              <UserProfileCard user={user} />
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow">
              <h3 className="font-bold mb-4">Quick Actions</h3>

              {[
                {
                  label: "Active Bids",
                  action: () =>
                    navigate("/Supplier-Bid-List", { state: { mobile } }),
                },
                { label: "Orders", link: "/manage-order/list-self-order" },
                { label: "Notifications", action: () => setShowPopup(true) },
              ].map((l, i) => (
                <button
                  key={i}
                  onClick={() => (l.action ? l.action() : navigate(l.link))}
                  className="w-full flex justify-between p-3 bg-slate-50 rounded-xl mb-2 hover:bg-emerald-50"
                >
                  {l.label}
                  <FaChevronRight />
                </button>
              ))}
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
