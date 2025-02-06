import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaGavel, FaBoxOpen, FaTruckMoving } from "react-icons/fa";
import Cards from "../../common/Cards/Cards";
import { useAuth } from "../../context/AuthContext/AuthContext";

const SellerDashboard = () => {
  const { user } = useAuth();
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        const response = await axios.get("https://phpserver-v77g.onrender.com/api/sellers");
  
        console.log("API Response:", response.data); // Log full response
  
        if (response.status === 200 && Array.isArray(response.data)) {
          const sellers = response.data;
  
          // Check if user.mobile exists
          if (!user?.mobile) {
            console.error("User mobile number is missing.");
            setLoading(false);
            return;
          }
  
          // Ensure all phone numbers are strings before comparison
          const seller = sellers.find((s) =>
            s.phoneNumbers.some((p) => String(p.value) === String(user.mobile))
          );
  
          if (seller) {
            console.log("Matching Seller Found:", seller);
            setSellerDetails(seller);
          } else {
            console.error("Seller not found for mobile:", user.mobile);
          }
        } else {
          console.error("Invalid API response format.");
        }
      } catch (error) {
        console.error("Error fetching seller details:", error);
        setError("Failed to fetch seller details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchSellerDetails();
  }, [user]);
  
  const dashboardData = [
    { title: "Manage Bids", count: 24, icon: FaGavel, link: "/manage-bids/bid-list" },
    { title: "Manage Self-Orders", count: 12, icon: FaBoxOpen, link: "/manage-self-orders" },
    { title: "Loading Entry", count: 7, icon: FaTruckMoving, link: "/loading-entry" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
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
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Seller Details</h2>
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
            <p>
              <strong>Status:</strong>
              <span className={`px-2 py-1 rounded-lg ${sellerDetails.selectedStatus === "active" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                {sellerDetails.selectedStatus}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-red-500">Seller details not available.</p>
        )}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {dashboardData.map((item, index) => (
          <Cards key={index} title={item.title} count={item.count} icon={item.icon} link={item.link} />
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
