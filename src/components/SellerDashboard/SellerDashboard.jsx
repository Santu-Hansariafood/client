import { useEffect, useState, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaBell, FaGavel, FaBoxOpen, FaTruckMoving } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";

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
      <div className="p-6 space-y-8">
        <header className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name}!
            </h1>
            <p>Here is your Seller Dashboard.</p>
          </div>

          <div
            className="relative cursor-pointer"
            onClick={() => setShowPopup(true)}
          >
            <FaBell />
            {notificationCount > 0 && (
              <span>{notificationCount}</span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-4 gap-6">
          {dashboardData.map((item, index) => (
            <Cards key={index} {...item} />
          ))}
        </div>

        <UserProfileCard user={user} />

        <PopupBox
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          title="Confirmed Bids"
        >
          {confirmedBids.length > 0 ? (
            confirmedBids.map((bid, i) => (
              <div key={i}>
                <p>Commodity: {bid.commodity}</p>
                <p>Rate: {bid.rate}</p>
              </div>
            ))
          ) : (
            <p>No confirmed bids found.</p>
          )}
        </PopupBox>
      </div>
    </Suspense>
  );
};

export default SellerDashboard;