import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RiLogoutBoxLine } from "react-icons/ri";
import { AiOutlineUser } from "react-icons/ai";
import { FaUsers, FaStore, FaTruck } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext/AuthContext";
import Cards from "../../common/Cards/Cards";
import SaudaChart from "../../common/Charts/SaudaChart/SaudaChart";
import BidChart from "../../common/Charts/BidChart/BidChart";

const Dashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [counts, setCounts] = useState({ buyers: 0, sellers: 0, consignees: 0, orders: 0 });

  const navigate = useNavigate();
  const { logout } = useAuth();

  const fetchCounts = useCallback(async () => {
    try {
      const responses = await Promise.all([
        axios.get("http://localhost:5000/api/buyers"),
        axios.get("http://localhost:5000/api/sellers"),
        axios.get("http://localhost:5000/api/consignees"),
        axios.get("http://localhost:5000/api/self-order"),
      ]);

      setCounts({
        buyers: responses[0].data.length || 0,
        sellers: responses[1].data.length || 0,
        consignees: responses[2].data.length || 0,
        orders: responses[3].data.length || 0,
      });
    } catch (error) {
      toast.error("Failed to fetch data counts", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
    });
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogoutConfirmation(true);
  }, []);

  const cancelLogout = useCallback(() => {
    setShowLogoutConfirmation(false);
  }, []);

  const memoizedCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Cards title="Total Buyers" count={counts.buyers} icon={FaUsers} link="/buyer/list" />
      <Cards title="Total Sellers" count={counts.sellers} icon={FaStore} link="/seller-details/list" />
      <Cards title="Total Consignees" count={counts.consignees} icon={FaTruck} link="/consignee/list" />
    </div>
  ), [counts]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-gray-800">Hansaria Food Private Limited</h1>
        <div className="relative">
          <button
            className="flex items-center space-x-2 font-medium text-gray-700 hover:text-gray-900"
            onClick={toggleDropdown}
          >
            <div className="w-10 h-10 rounded-full bg-gray-300 grid place-items-center">
              <AiOutlineUser size={24} />
            </div>
            <span>Profile</span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg">
              <button
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-100 flex items-center space-x-2"
                onClick={confirmLogout}
              >
                <RiLogoutBoxLine size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="px-6 py-8">
        <p className="text-lg font-medium text-center text-gray-700 mb-6">Admin Report</p>
        {memoizedCards}
        <div className="mt-8">
          <SaudaChart apiUrl="http://localhost:5000/api/self-order" />
        </div>
        <div className="mt-8">
          <BidChart apiUrl="http://localhost:5000/api/bids" />
        </div>
      </main>
      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
