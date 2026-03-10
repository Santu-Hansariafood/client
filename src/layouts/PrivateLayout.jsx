import { Suspense, useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext/AuthContext";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../common/Header/Header";
import LogoutConfirmationModal from "../common/LogoutConfirmationModal/LogoutConfirmationModal";
import { prefetchRoute } from "../utils/LazyPages/LazyPages";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin" />
  </div>
);

const PrivateLayout = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    prefetchRoute("/dashboard");
    const id = setTimeout(() => {
      prefetchRoute("/buyer/list");
      prefetchRoute("/manage-bids/bid-list");
      prefetchRoute("/company/list");
    }, 800);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      {userRole === "Admin" && <Sidebar />}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
        <main className="flex-1 min-w-0 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {showLogoutConfirmation && (
        <LogoutConfirmationModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirmation(false)}
        />
      )}
    </div>
  );
};

export default PrivateLayout;
