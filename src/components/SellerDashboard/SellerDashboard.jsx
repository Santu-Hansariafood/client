import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaBell,
  FaGavel,
  FaBoxOpen,
  FaTruckMoving,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";

const Cards = lazy(() => import("../../common/Cards/Cards"));
const Loading = lazy(() => import("../../common/Loading/Loading"));
const Header = lazy(() => import("../../common/Header/Header"));
const LogoutConfirmationModal = lazy(() =>
  import("../../common/LogoutConfirmationModal/LogoutConfirmationModal")
);
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const SellerDashboard = () => {
  const { mobile, logout } = useAuth();
  const navigate = useNavigate();
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerBidCount, setSellerBidCount] = useState(0);
  const [participateBidCount, setParticipateBidCount] = useState(0);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [confirmedBids, setConfirmedBids] = useState([]);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        const [sellersRes, bidsRes, participateRes, confirmBidsRes] =
          await Promise.all([
            axios.get("https://api.hansariafood.shop/api/sellers"),
            axios.get("https://api.hansariafood.shop/api/bids"),
            axios.get("https://api.hansariafood.shop/api/participatebids"),
            axios.get("https://api.hansariafood.shop/api/confirm-bid"),
          ]);

        if (!mobile) {
          setError("Mobile number is required for verification.");
          setLoading(false);
          return;
        }

        if (sellersRes.status === 200 && Array.isArray(sellersRes.data)) {
          const seller = sellersRes.data.find((s) =>
            s.phoneNumbers.some((p) => String(p.value) === String(mobile))
          );

          if (seller) {
            setSellerDetails(seller);
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const recentSellerBids = bidsRes.data.filter(
              (bid) =>
                new Date(bid.createdAt) >= oneDayAgo &&
                seller.commodities.some((c) => c.name === bid.commodity)
            );

            setSellerBidCount(recentSellerBids.length);

            setParticipateBidCount(
              participateRes.data.filter(
                (p) => String(p.mobile) === String(mobile)
              ).length
            );

            const confirmed = confirmBidsRes.data
              .filter(
                (bid) => String(bid.phone) === String(mobile) && bid.status
              )
              .map((confirmBid) => {
                const matchedBid = bidsRes.data.find(
                  (b) => b._id === confirmBid.bidId
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
      link: "/manage-self-orders",
    },
    {
      title: "Loading Entry",
      count: 7,
      icon: FaTruckMoving,
      link: "/loading-entry",
    },
    {
      title: "Participate on Bid",
      count: participateBidCount,
      icon: FaGavel,
      link: "/participate-bid-list",
    },
  ];

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/", { replace: true });
  }, [logout, navigate]);

  // Secure back navigation with auth check
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
      <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
      <div
        className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200 p-4 sm:p-8 flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #e0e7ff 0%, #fff 60%, #f3e8ff 100%)",
        }}
      >
        <div className="w-full max-w-5xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-md border border-blue-200 text-blue-700 rounded-full shadow-lg hover:bg-blue-100 transition-all"
            >
              <span className="font-bold">&#8592; Back</span>
            </button>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 drop-shadow-lg">
              Seller Dashboard
            </h1>
            <div
              className="relative cursor-pointer"
              onClick={() => setShowPopup(true)}
            >
              <FaBell className="text-3xl text-blue-600 hover:text-pink-500 transition-all" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                  {notificationCount}
                </span>
              )}
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl mb-10 flex flex-col sm:flex-row items-center justify-between p-8 border border-blue-100">
            <div className="text-gray-700 w-full sm:w-2/3">
              {loading ? (
                <Loading />
              ) : error ? (
                <p className="text-red-500 font-semibold">{error}</p>
              ) : sellerDetails ? (
                <div className="space-y-2">
                  <p>
                    <span className="font-bold text-blue-700">Name:</span> {sellerDetails.sellerName}
                  </p>
                  <p>
                    <span className="font-bold text-blue-700">Phone:</span> {sellerDetails.phoneNumbers.map((p) => p.value).join(", ")}
                  </p>
                  <p>
                    <span className="font-bold text-blue-700">Email:</span> {sellerDetails.emails.map((e) => e.value).join(", ")}
                  </p>
                  <p>
                    <span className="font-bold text-blue-700">Company:</span> {sellerDetails.companies.join(", ")}
                  </p>
                  <p>
                    <span className="font-bold text-blue-700">Commodity:</span> {sellerDetails.commodities.map((c) => c.name).join(", ")}
                  </p>
                </div>
              ) : (
                <p className="text-red-500 font-semibold">Seller details not available.</p>
              )}
            </div>
            <div className="flex flex-col items-center mt-6 sm:mt-0 w-full sm:w-1/3">
              <div className="w-28 h-28 flex items-center justify-center bg-gradient-to-br from-blue-200 via-white to-purple-200 text-blue-800 text-4xl font-extrabold rounded-full border-4 border-blue-300 shadow-xl mb-2">
                {getInitials(sellerDetails?.sellerName)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {dashboardData.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(item.link, { state: item.state })}
                className="cursor-pointer"
              >
                <Cards
                  title={item.title}
                  count={item.count}
                  icon={item.icon}
                  link={item.link}
                  className="rounded-2xl shadow-lg bg-white/80 hover:bg-blue-50 transition-all border border-blue-100"
                />
              </div>
            ))}
          </div>
          {showLogoutConfirmation && (
            <LogoutConfirmationModal
              onConfirm={handleLogout}
              onCancel={() => setShowLogoutConfirmation(false)}
            />
          )}
          <PopupBox
            isOpen={showPopup}
            onClose={() => setShowPopup(false)}
            title="Confirmed Bids"
          >
            {confirmedBids.length > 0 ? (
              <ul className="space-y-4">
                {confirmedBids.map((bid, index) => (
                  <li key={index} className="p-4 bg-white/80 rounded-2xl shadow border border-blue-100">
                    <p>
                      <span className="font-bold text-blue-700">Group:</span> {bid.group || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Consignee:</span> {bid.consignee || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Origin:</span> {bid.origin || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Commodity:</span> {bid.commodity || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Bid Quantity:</span> {bid.bidQuantity || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Bid Rate:</span> {bid.bidRate || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Confirmed Rate:</span> {bid.rate || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Confirmed Quantity:</span> {bid.quantity || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-700">Status:</span> {bid.status}
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
