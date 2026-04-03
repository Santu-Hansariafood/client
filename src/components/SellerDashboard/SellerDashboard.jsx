import { useEffect, useState, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaBell,
  FaGavel,
  FaBoxOpen,
  FaTruckMoving,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";

const Cards = lazy(() => import("../../common/Cards/Cards"));
const Loading = lazy(() => import("../../common/Loading/Loading"));
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const SellerDashboard = () => {
  const { mobile, user } = useAuth();
  const navigate = useNavigate();

  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sellerBidCount, setSellerBidCount] = useState(0);
  const [participateBidCount, setParticipateBidCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [confirmedBids, setConfirmedBids] = useState([]);

  useEffect(() => {
    if (!mobile) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }

    const fetchSellerDetails = async () => {
      try {
        setLoading(true);

        const [sellersRes, bidsRes, participateRes, confirmBidsRes] =
          await Promise.all([
            axios.get("/sellers"),
            axios.get("/bids"),
            axios.get("/participatebids"),
            axios.get("/confirm-bid"),
          ]);

        const sellers = sellersRes?.data || [];
        const bids = bidsRes?.data || [];
        const participate = participateRes?.data || [];
        const confirmBids = confirmBidsRes?.data || [];

        const seller = sellers.find((s) =>
          s?.phoneNumbers?.some((p) => String(p?.value) === String(mobile)),
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

        setParticipateBidCount(
          participate.filter((p) => String(p?.mobile) === String(mobile))
            .length,
        );

        const confirmed = confirmBids
          .filter((bid) => String(bid?.phone) === String(mobile) && bid?.status)
          .map((confirmBid) => {
            const matchedBid = bids.find((b) => b?._id === confirmBid?.bidId);

            return matchedBid
              ? {
                  ...confirmBid,
                  ...matchedBid,
                }
              : null;
          })
          .filter(Boolean);

        setConfirmedBids(confirmed);
        setNotificationCount(confirmed.length);
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
      title: "Your Bids",
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
      count: 12,
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
      color: "from-blue-400 to-indigo-600",
    },
    {
      title: "Loading",
      count: 7,
      icon: FaTruckMoving,
      link: "/Loading-Entry/list-loading-entry",
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
                Welcome, Mr. {user?.name} 👋
              </h1>
              <p className="text-emerald-100 text-sm">
                Manage your business efficiently
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    <img
                      src="/icons/favicon-16x16.png"
                      alt="Hansaria"
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      Hansaria
                    </span>
                  </div>

                  <div className="relative">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px]">
                      ✓
                    </span>
                    <span className="absolute inset-0 animate-pulseSlow bg-blue-400 opacity-50 rounded-full"></span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-white/90">
                  <img
                    src="/icons/favicon-16x16.png"
                    className="w-3 h-3 rounded-full"
                  />
                  <span>Trustable Seller</span>
                </div>
              </div>
              <div
                className="relative cursor-pointer p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition"
                onClick={() => setShowPopup(true)}
              >
                <FaBell />

                {notificationCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                      {notificationCount}
                    </span>
                    <span className="absolute inset-0 animate-pulseSlow bg-white/20 rounded-2xl"></span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {dashboardData.map((item, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-2xl shadow hover:shadow-xl transition"
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
                { label: "Active Bids", link: "/Supplier-Bid-List" },
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
              confirmedBids.map((bid, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl mb-2">
                  <h4 className="font-bold">{bid.commodity}</h4>
                  <p className="text-sm text-slate-500">
                    {bid.origin} → {bid.consignee}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400">No notifications</p>
            )}
          </PopupBox>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default SellerDashboard;
