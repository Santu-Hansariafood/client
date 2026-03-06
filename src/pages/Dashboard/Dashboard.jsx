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
        axios.get("/buyers"),
        axios.get("/sellers"),
        axios.get("/consignees"),
        axios.get("/self-order"),
      ]);

      const getCount = (res) => {
        const data = res?.data;
        if (Array.isArray(data)) return data.length;
        if (data && Array.isArray(data.data)) return data.data.length;
        return 0;
      };

      setCounts({
        buyers: getCount(responses[0]),
        sellers: getCount(responses[1]),
        consignees: getCount(responses[2]),
        orders: getCount(responses[3]),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch data counts");
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
        <main className="min-h-screen px-6 py-10 bg-green-50">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 text-green-800">
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
