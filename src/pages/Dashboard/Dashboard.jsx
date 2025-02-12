import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import Loading from "../../common/Loading/Loading";

const DashboardLayout = lazy(() =>
  import("../../layouts/DashboardLayout/DashboardLayout")
);
const Header = lazy(() => import("../../common/Header/Header"));
const LogoutConfirmationModal = lazy(() =>
  import("../../common/LogoutConfirmationModal/LogoutConfirmationModal")
);
const CardGrid = lazy(() => import("./CardGrid/CardGrid"));
const ChartSection = lazy(() => import("./ChartSection/ChartSection"));

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
        axios.get("https://phpserver-v77g.onrender.com/api/buyers"),
        axios.get("https://phpserver-v77g.onrender.com/api/sellers"),
        axios.get("https://phpserver-v77g.onrender.com/api/consignees"),
        axios.get("https://phpserver-v77g.onrender.com/api/self-order"),
      ]);

      setCounts({
        buyers: responses[0].data.length || 0,
        sellers: responses[1].data.length || 0,
        consignees: responses[2].data.length || 0,
        orders: responses[3].data.length || 0,
      });
    } catch (error) {
      toast.error("Failed to fetch data counts", error);
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
    <Suspense fallback={<Loading />}>
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
    </Suspense>
  );
};

export default Dashboard;
