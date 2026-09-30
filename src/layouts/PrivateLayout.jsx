import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext/AuthContext";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../common/Header/Header";
import Footer from "../common/Footer/Footer";
import AIAgent from "../components/AIAgent/AIAgent";
import LogoutConfirmationModal from "../common/LogoutConfirmationModal/LogoutConfirmationModal";
import { prefetchRoute } from "../utils/LazyPages/LazyPages";
import Loading from "../common/Loading/Loading";
import MobileBottomNav from "../common/MobileBottomNav/MobileBottomNav";
import DashboardLayout from "./DashboardLayout/DashboardLayout";

const PageLoader = () => <Loading />;

const PrivateLayout = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isDashboardUser = useMemo(
    () =>
      userRole === "Admin" ||
      userRole === "Employee" ||
      userRole === "SuperAdmin" ||
      userRole === "Owner",
    [userRole],
  );

  const isBottomNavUser = useMemo(
    () =>
      userRole === "Buyer" ||
      userRole === "Seller" ||
      userRole === "Admin" ||
      userRole === "Employee" ||
      userRole === "Transporter" ||
      userRole === "SuperAdmin" ||
      userRole === "Owner",
    [userRole],
  );

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    prefetchRoute("/dashboard");
  }, []);

  return (
    <DashboardLayout>
      <div className="flex h-screen overflow-hidden">
        {isDashboardUser && (
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        )}

        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <Header
            onLogoutClick={() => setShowLogoutConfirmation(true)}
            showMenuButton={isDashboardUser}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            isProfileDropdownOpen={isProfileDropdownOpen}
            setProfileDropdownOpen={setProfileDropdownOpen}
          />

          <main className="flex-1 overflow-y-auto">
            <div
              className={`min-h-full flex flex-col ${
                isBottomNavUser ? "pb-24 sm:pb-20 md:pb-6" : "pb-6"
              }`}
            >
              <div className="flex-1 px-3 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6">
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </div>

              <Footer />
            </div>
          </main>
        </div>

        {isBottomNavUser && <MobileBottomNav />}

        {showLogoutConfirmation && (
          <LogoutConfirmationModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirmation(false)}
          />
        )}

        {isDashboardUser && <AIAgent />}
      </div>
    </DashboardLayout>
  );
};

export default PrivateLayout;
