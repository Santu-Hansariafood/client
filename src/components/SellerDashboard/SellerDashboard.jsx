import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaBell,
  FaGavel,
  FaBoxOpen,
  FaTruckMoving,
  FaUpload,
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
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentSellerBids = bidsRes.data.filter(
              (bid) =>
                new Date(bid.createdAt) >= sevenDaysAgo &&
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
        setError("Failed to fetch seller details. Please try again.", error);
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

  return (
    <Suspense fallback={<Loading />}>
      <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Seller Dashboard</h1>
          <div
            className="relative cursor-pointer"
            onClick={() => setShowPopup(true)}
          >
            <FaBell className="text-2xl text-gray-600 hover:text-blue-500 transition-all" />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {notificationCount}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-gray-700">
            {loading ? (
              <Loading />
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : sellerDetails ? (
              <>
                <p>
                  <strong>Name:</strong> {sellerDetails.sellerName}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {sellerDetails.phoneNumbers.map((p) => p.value).join(", ")}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {sellerDetails.emails.map((e) => e.value).join(", ")}
                </p>
                <p>
                  <strong>Company:</strong> {sellerDetails.companies.join(", ")}
                </p>
                <p>
                  <strong>Commodity:</strong>{" "}
                  {sellerDetails.commodities.map((c) => c.name).join(", ")}
                </p>
              </>
            ) : (
              <p className="text-red-500">Seller details not available.</p>
            )}
          </div>
          <div className="flex flex-col items-center mt-4 sm:mt-0">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-300 text-gray-800 text-2xl font-bold rounded-full border-2 border-gray-400">
              {getInitials(sellerDetails?.sellerName)}
            </div>
            {/* <button className="mt-2 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
              <FaUpload /> Upload
            </button> */}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {dashboardData.map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(item.link, { state: item.state })}
            >
              <Cards
                title={item.title}
                count={item.count}
                icon={item.icon}
                link={item.link}
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
                <li key={index} className="p-4 bg-gray-100 rounded-lg shadow">
                  <p>
                    <strong>Group:</strong> {bid.group || "N/A"}
                  </p>
                  <p>
                    <strong>Consignee:</strong> {bid.consignee || "N/A"}
                  </p>
                  <p>
                    <strong>Origin:</strong> {bid.origin || "N/A"}
                  </p>
                  <p>
                    <strong>Commodity:</strong> {bid.commodity || "N/A"}
                  </p>
                  <p>
                    <strong>Bid Quantity:</strong> {bid.bidQuantity || "N/A"}
                  </p>
                  <p>
                    <strong>Bid Rate:</strong> {bid.bidRate || "N/A"}
                  </p>
                  <p>
                    <strong>Confirmed Rate:</strong> {bid.rate || "N/A"}
                  </p>
                  <p>
                    <strong>Confirmed Quantity:</strong> {bid.quantity || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {bid.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">
              No confirmed bids found.
            </p>
          )}
        </PopupBox>
      </div>
    </Suspense>
  );
};

export default SellerDashboard;
