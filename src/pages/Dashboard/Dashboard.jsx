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
        axios.get("https://phpserver-kappa.vercel.app/api/buyers"),
        axios.get("https://phpserver-kappa.vercel.app/api/sellers"),
        axios.get("https://phpserver-kappa.vercel.app/api/consignees"),
        axios.get("https://phpserver-kappa.vercel.app/api/self-order"),
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
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return (
    <Suspense fallback={<Loading />}>
      <DashboardLayout>
        <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
        <main className="min-h-screen px-6 py-10 bg-gradient-to-br from-blue-100 via-white to-purple-100">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
              Admin Report
            </h1>
            <CardGrid counts={counts} />
            <ChartSection />
          </div>
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
