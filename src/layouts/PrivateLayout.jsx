import { Suspense, useEffect, useState, useCallback } from "react";
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

const PageLoader = () => (
  <Loading/>
);

const PrivateLayout = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    prefetchRoute("/dashboard");
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {(userRole === "Admin" || userRole === "Employee") && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Header
          onLogoutClick={() => setShowLogoutConfirmation(true)}
          showMenuButton={
            userRole === "Admin" || userRole === "Employee"
          }
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isProfileDropdownOpen={isProfileDropdownOpen}
          setProfileDropdownOpen={setProfileDropdownOpen}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
          <div className={`min-h-full flex flex-col ${(userRole === "Buyer" || userRole === "Seller") ? "pb-20 md:pb-0" : ""}`}>
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>

            <Footer />
          </div>
        </main>
      </div>

      {showLogoutConfirmation && (
        <LogoutConfirmationModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirmation(false)}
        />
      )}

      {userRole === "Admin" && <AIAgent />}
      {userRole === "Employee" && <AIAgent />}
    </div>
  );
};

export default PrivateLayout;
