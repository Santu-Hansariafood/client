import { useEffect, useState, lazy, Suspense } from "react";
import axios from "axios";
import {
  FaBell,
  FaGavel,
  FaBoxOpen,
  FaTruckMoving,
  FaUpload,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const Cards = lazy(() => import("../../common/Cards/Cards"));
import { useAuth } from "../../context/AuthContext/AuthContext";
import Loading from "../../common/Loading/Loading";

const SellerDashboard = () => {
  const { mobile } = useAuth();
  const navigate = useNavigate();
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerBidCount, setSellerBidCount] = useState(0);
  const [participateBidCount, setParticipateBidCount] = useState(0);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        const [sellersRes, bidsRes, participateRes] = await Promise.all([
          axios.get("https://phpserver-v77g.onrender.com/api/sellers"),
          axios.get("https://phpserver-v77g.onrender.com/api/bids"),
          axios.get("http://localhost:5000/api/participatebids"),
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
            setSellerBidCount(
              bidsRes.data.filter((bid) =>
                seller.commodities.some((c) => c.name === bid.commodity)
              ).length
            );
            setParticipateBidCount(
              participateRes.data.filter((p) => String(p.mobile) === String(mobile)).length
            );
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

  return (
    <Suspense fallback={<Loading/>}>
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Seller Dashboard</h1>
        <div className="relative cursor-pointer">
          <FaBell className="text-2xl text-gray-600 hover:text-blue-500 transition-all" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            3
          </span>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Seller Details
          </h2>
          {loading ? (
            <Loading/>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : sellerDetails ? (
            <div className="text-gray-700">
              <p><strong>Name:</strong> {sellerDetails.sellerName}</p>
              <p><strong>Phone:</strong> {sellerDetails.phoneNumbers.map((p) => p.value).join(", ")}</p>
              <p><strong>Email:</strong> {sellerDetails.emails.map((e) => e.value).join(", ")}</p>
              <p><strong>Company:</strong> {sellerDetails.companies.join(", ")}</p>
              <p><strong>Commodity:</strong> {sellerDetails.commodities.map((c) => c.name).join(", ")}</p>
            </div>
          ) : (
            <p className="text-red-500">Seller details not available.</p>
          )}
        </div>
        <div className="flex flex-col items-center mt-4 sm:mt-0">
          <div className="w-24 h-24 flex items-center justify-center bg-gray-300 text-gray-800 text-2xl font-bold rounded-full border-2 border-gray-400">
            {getInitials(sellerDetails?.sellerName)}
          </div>
          <button className="mt-2 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
            <FaUpload /> Upload
          </button>
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
    </div>
    </Suspense>
  );
};

export default SellerDashboard;
