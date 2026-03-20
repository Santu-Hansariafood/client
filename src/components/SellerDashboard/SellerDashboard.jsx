import { useEffect, useState, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaBell, FaGavel, FaBoxOpen, FaTruckMoving, FaChevronRight } from "react-icons/fa";
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
      setError("Mobile number is required for verification.");
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
          s?.phoneNumbers?.some(
            (p) => String(p?.value) === String(mobile)
          )
        );

        if (!seller) {
          setError("No seller found for this mobile number.");
          return;
        }

        setSellerDetails(seller);

        // Last 24 hours bids
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentSellerBids = bids.filter(
          (bid) =>
            new Date(bid?.createdAt) >= oneDayAgo &&
            seller?.commodities?.some(
              (c) => c?.name === bid?.commodity
            )
        );

        setSellerBidCount(recentSellerBids.length);

        setParticipateBidCount(
          participate.filter(
            (p) => String(p?.mobile) === String(mobile)
          ).length
        );

        const confirmed = confirmBids
          .filter(
            (bid) =>
              String(bid?.phone) === String(mobile) && bid?.status
          )
          .map((confirmBid) => {
            const matchedBid = bids.find(
              (b) => b?._id === confirmBid?.bidId
            );

            return matchedBid
              ? {
                  ...confirmBid,
                  group: matchedBid.group,
                  consignee: matchedBid.consignee,
                  origin: matchedBid.origin,
                  commodity: matchedBid.commodity,
                  bidRate: matchedBid.rate,
                  bidQuantity: matchedBid.quantity,
                }
              : null;
          })
          .filter(Boolean);

        setConfirmedBids(confirmed);
        setNotificationCount(confirmed.length);
      } catch (err) {
        console.error(err); // 🔥 important
        setError("Failed to fetch seller details.");
        toast.error("Server error while loading dashboard");
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
      state: sellerDetails
        ? {
            commodities: sellerDetails.commodities?.map((c) => c._id),
            commodityNames: sellerDetails.commodities?.map((c) => c.name),
            mobile,
          }
        : {},
    },
    {
      title: "Manage Self-Orders",
      count: 12,
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
    },
    {
      title: "Loading Entry",
      count: 7,
      icon: FaTruckMoving,
      link: "/Loading-Entry/list-loading-entry",
    },
    {
      title: "Participate on Bid",
      count: participateBidCount,
      icon: FaGavel,
      link: "/participate-bid-list",
    },
  ];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={`Welcome back, ${user?.name}!`}
        subtitle="Here is your Seller Dashboard."
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Account Overview</h2>
              <p className="text-slate-500 text-sm mt-1">Manage your bids and orders in one place.</p>
            </div>
            <div
              className="relative cursor-pointer p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors shadow-sm"
              onClick={() => setShowPopup(true)}
            >
              <FaBell className="text-xl" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {notificationCount}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardData.map((item, index) => (
              <Cards key={index} {...item} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <UserProfileCard user={user} />
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Quick Links</h3>
                <p className="text-slate-500 text-sm mb-6">Access your frequently used sections.</p>
                <div className="space-y-4">
                  {[
                    { label: "View Active Bids", link: "/Supplier-Bid-List" },
                    { label: "Order History", link: "/manage-order/list-self-order" },
                    { label: "Notification Settings", action: () => setShowPopup(true) }
                  ].map((link, i) => (
                    <button
                      key={i}
                      onClick={() => link.action ? link.action() : navigate(link.link)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-all group/link"
                    >
                      {link.label}
                      <FaChevronRight className="text-xs group-hover/link:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-12 -mt-12 opacity-50"></div>
            </div>
          </div>

          <PopupBox
            isOpen={showPopup}
            onClose={() => setShowPopup(false)}
            title="Notifications"
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {confirmedBids.length > 0 ? (
                confirmedBids.map((bid, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{bid.commodity}</h4>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Confirmed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-500">
                      <p>Group: <span className="text-slate-700 font-medium">{bid.group}</span></p>
                      <p>Consignee: <span className="text-slate-700 font-medium">{bid.consignee}</span></p>
                      <p>Origin: <span className="text-slate-700 font-medium">{bid.origin}</span></p>
                      <p>Qty: <span className="text-slate-700 font-medium">{bid.quantity}</span></p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 italic">
                  No notifications found.
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