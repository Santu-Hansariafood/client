import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";

import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import Header from "./Header/Header";
import LogoutConfirmationModal from "./LogoutConfirmationModal/LogoutConfirmationModal";
import CardGrid from "./CardGrid/CardGrid";
import ChartSection from "./ChartSection/ChartSection";

const Dashboard = () => {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [counts, setCounts] = useState({
    buyers: 0,
    sellers: 0,
    consignees: 0,
    orders: 0,
  });

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
      toast.error("Failed to fetch data counts");
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return (
    <DashboardLayout>
      <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
      <main className="px-6 py-8">
        <p className="text-lg font-medium text-center text-gray-700 mb-6">
          Admin Report
        </p>
        <CardGrid counts={counts} />
        <ChartSection />
      </main>
      {showLogoutConfirmation && (
        <LogoutConfirmationModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirmation(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
