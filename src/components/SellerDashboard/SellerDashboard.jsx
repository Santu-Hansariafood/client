import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaBell, FaGavel, FaBoxOpen, FaTruckMoving } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";

const Cards = lazy(() => import("../../common/Cards/Cards"));
const Loading = lazy(() => import("../../common/Loading/Loading"));
const LogoutConfirmationModal = lazy(
  () => import("../../common/LogoutConfirmationModal/LogoutConfirmationModal"),
);
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const SellerDashboard = () => {
  const { mobile, user, logout } = useAuth();
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
    const fetchSellerDetails = async () => {
      try {
        const [sellersRes, bidsRes, participateRes, confirmBidsRes] =
          await Promise.all([
            axios.get("/sellers"),
            axios.get("/bids"),
            axios.get("/participatebids"),
            axios.get("/confirm-bid"),
          ]);

        if (!mobile) {
          setError("Mobile number is required for verification.");
          setLoading(false);
          return;
        }

        if (sellersRes.status === 200 && Array.isArray(sellersRes.data)) {
          const seller = sellersRes.data.find((s) =>
            s.phoneNumbers.some((p) => String(p.value) === String(mobile)),
          );

          if (seller) {
            setSellerDetails(seller);
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const recentSellerBids = bidsRes.data.filter(
              (bid) =>
                new Date(bid.createdAt) >= oneDayAgo &&
                seller.commodities.some((c) => c.name === bid.commodity),
            );

            setSellerBidCount(recentSellerBids.length);

            setParticipateBidCount(
              participateRes.data.filter(
                (p) => String(p.mobile) === String(mobile),
              ).length,
            );

            const confirmed = confirmBidsRes.data
              .filter(
                (bid) => String(bid.phone) === String(mobile) && bid.status,
              )
              .map((confirmBid) => {
                const matchedBid = bidsRes.data.find(
                  (b) => b._id === confirmBid.bidId,
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
              .filter((bid) => bid !== null);

            setConfirmedBids(confirmed);
            setNotificationCount(confirmed.length);
          } else {
            setError("No seller found for this mobile number.");
          }
        } else {
          setError("Invalid response from server.");
        }
      } catch (error) {
        setError("Failed to fetch seller details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerDetails();
  }, [mobile]);

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.split(" ");
    return words.length > 1
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();
  };

  const dashboardData = [
    {
      title: "Your Bids",
      count: sellerBidCount,
      icon: FaGavel,
      link: "/Supplier-Bid-List",
      state: sellerDetails
        ? {
            commodities: sellerDetails.commodities.map((c) => c._id),
            commodityNames: sellerDetails.commodities.map((c) => c.name),
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

  const handleBack = () => {
    if (!mobile) {
      toast.error("You are not authenticated. Please login again.");
      navigate("/login", { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}!</h1>
            <p className="text-slate-500">Here is your Seller Dashboard.</p>
          </div>
          <div
            className="relative cursor-pointer bg-white p-3 rounded-full shadow-sm border border-slate-100"
            onClick={() => setShowPopup(true)}
          >
            <FaBell className="text-xl text-emerald-600 hover:text-emerald-700 transition-all" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                {notificationCount}
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {dashboardData.map((item, index) => (
            <div key={index} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl border border-emerald-100 hover:scale-[1.02] transition-all duration-300">
                <Cards
                  title={item.title}
                  count={item.count}
                  icon={item.icon}
                  link={item.link}
                  state={item.state}
                />
              </div>
            </div>
          ))}
        </div>

        <UserProfileCard user={user} />

        <PopupBox
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          title="Confirmed Bids"
        >
            {confirmedBids.length > 0 ? (
              <ul className="space-y-4">
                {confirmedBids.map((bid, index) => (
                  <li
                    key={index}
                    className="p-4 bg-white/80 rounded-2xl shadow border border-blue-100"
                  >
                    <p>
                      <span className="font-bold text-blue-700">Group:</span>{" "}
                      {bid.group || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">
                        Consignee:
                      </span>{" "}
                      {bid.consignee || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Origin:</span>{" "}
                      {bid.origin || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">
                        Commodity:
                      </span>{" "}
                      {bid.commodity || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">
                        Bid Quantity:
                      </span>{" "}
                      {bid.bidQuantity || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Bid Rate:</span>{" "}
                      {bid.bidRate || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">
                        Confirmed Rate:
                      </span>{" "}
                      {bid.rate || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">
                        Confirmed Quantity:
                      </span>{" "}
                      {bid.quantity || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Status:</span>{" "}
                      {bid.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 font-semibold">
                No confirmed bids found.
              </p>
            )}
          </PopupBox>
        </div>
      </div>
    </Suspense>
  );
};

export default SellerDashboard;
