import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaGavel, FaBoxOpen, FaTruckMoving } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Cards from "../../common/Cards/Cards";
import { useAuth } from "../../context/AuthContext/AuthContext";

const SellerDashboard = () => {
  const { mobile } = useAuth();
  const navigate = useNavigate();
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerBidCount, setSellerBidCount] = useState(0);
  const [totalBidCount, setTotalBidCount] = useState(0);
  const [matchedCommodities, setMatchedCommodities] = useState([]);
  const [matchedBids, setMatchedBids] = useState([]);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        const [sellersRes, commoditiesRes, bidsRes] = await Promise.all([
          axios.get("https://phpserver-v77g.onrender.com/api/sellers"),
          axios.get("https://phpserver-v77g.onrender.com/api/commodities"),
          axios.get("https://phpserver-v77g.onrender.com/api/bids"),
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

          setTotalBidCount(bidsRes.data.length); // Total bids in the system

          if (seller) {
            setSellerDetails(seller);

            const sellerCommodityNames = seller.commodities.map((c) => c.name);

            // Filter bids that match seller's commodities
            const sellerBids = bidsRes.data.filter((bid) =>
              commoditiesRes.data.some(
                (commodity) =>
                  commodity._id === bid.commodity &&
                  sellerCommodityNames.includes(commodity.name)
              )
            );

            setSellerBidCount(sellerBids.length); // Seller's matched bid count

            // Match commodities based on bid commodity IDs
            const matchedCommodities = commoditiesRes.data.filter((commodity) =>
              sellerBids.some((bid) => bid.commodity === commodity._id)
            );

            setMatchedCommodities(matchedCommodities);
            setMatchedBids(sellerBids);
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

  const dashboardData = [
    { title: "Your Bids", count: sellerBidCount, icon: FaGavel, link: "/Supplier-Bid-List" },
    { title: "Total Bids in System", count: totalBidCount, icon: FaGavel, link: "/all-bids" },
    { title: "Matched Commodities", count: matchedCommodities.length, icon: FaBoxOpen, link: "/matched-commodities" },
    { title: "Manage Self-Orders", count: 12, icon: FaBoxOpen, link: "/manage-self-orders" },
    { title: "Loading Entry", count: 7, icon: FaTruckMoving, link: "/loading-entry" },
  ];

  return (
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

      {/* Seller Details */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Seller Details</h2>
        {loading ? (
          <p>Loading...</p>
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

      {/* Matched Commodities & Bids */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Matched Commodities & Bids</h2>
        {loading ? (
          <p>Loading...</p>
        ) : matchedCommodities.length > 0 ? (
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 text-sm leading-normal">
                <th className="py-3 px-6 text-left">Commodity</th>
                <th className="py-3 px-6 text-left">Bid Count</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {matchedCommodities.map((commodity) => {
                const commodityBids = matchedBids.filter((bid) => bid.commodity === commodity._id);
                return (
                  <tr key={commodity._id} className="border-b border-gray-200">
                    <td className="py-3 px-6">{commodity.name}</td>
                    <td className="py-3 px-6">{commodityBids.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-red-500">No matched commodities found.</p>
        )}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {dashboardData.map((item, index) => (
          <div key={index} onClick={() => navigate(item.link)}>
            <Cards title={item.title} count={item.count} icon={item.icon} link={item.link} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
