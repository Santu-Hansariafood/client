import { Suspense, useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext/AuthContext";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../common/Header/Header";
import Footer from "../common/Footer/Footer";
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

  // Screenshot and Content Protection Logic
  useEffect(() => {
    if (userRole === "Admin") return;

    const preventActions = (e) => {
      // Prevent Right Click
      if (e.type === "contextmenu") {
        e.preventDefault();
        return false;
      }

      // Prevent Keyboard Shortcuts
      if (e.type === "keydown") {
        const { ctrlKey, shiftKey, key, keyCode } = e;
        
        // PrintScreen (Key code 44 is often not catchable, but 'PrintScreen' string might be)
        if (key === "PrintScreen" || keyCode === 44) {
          navigator.clipboard.writeText(""); // Clear clipboard
          toast.warn("Screenshots are disabled for your role.");
          return false;
        }

        // Ctrl+P (Print)
        if (ctrlKey && (key === "p" || keyCode === 80)) {
          e.preventDefault();
          toast.warn("Printing is disabled.");
          return false;
        }

        // Ctrl+S (Save)
        if (ctrlKey && (key === "s" || keyCode === 83)) {
          e.preventDefault();
          return false;
        }

        // Ctrl+Shift+I, F12 (DevTools)
        if ((ctrlKey && shiftKey && (key === "I" || keyCode === 73)) || key === "F12" || keyCode === 123) {
          e.preventDefault();
          return false;
        }

        // Ctrl+U (View Source)
        if (ctrlKey && (key === "u" || keyCode === 85)) {
          e.preventDefault();
          return false;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optional: Can add logic here to blur content when switching apps
      }
    };

    // Add listeners
    window.addEventListener("contextmenu", preventActions);
    window.addEventListener("keydown", preventActions);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Add CSS class for protection
    document.body.classList.add("select-none");
    const style = document.createElement("style");
    style.id = "protection-styles";
    style.innerHTML = `
      * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("contextmenu", preventActions);
      window.removeEventListener("keydown", preventActions);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.body.classList.remove("select-none");
      const existingStyle = document.getElementById("protection-styles");
      if (existingStyle) existingStyle.remove();
    };
  }, [userRole]);

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
          <div className="min-h-full flex flex-col">
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
    </div>
  );
};

export default PrivateLayout;
