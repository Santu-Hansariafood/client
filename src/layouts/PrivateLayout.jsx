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

  useEffect(() => {
    if (userRole === "Admin") {
      document.body.classList.remove("select-none", "content-protected");
      const existingStyle = document.getElementById("protection-styles");
      if (existingStyle) existingStyle.remove();
      return;
    }

    const preventActions = (e) => {
      if (e.type === "contextmenu") {
        e.preventDefault();
        return false;
      }

      if (e.type === "keydown") {
        const { ctrlKey, shiftKey, metaKey, key, keyCode } = e;
        
        if (key === "PrintScreen" || keyCode === 44) {
          navigator.clipboard.writeText(""); // Clear clipboard
          toast.warn("Screenshots are disabled for your role.", { autoClose: 2000 });
          return false;
        }

        if (metaKey && shiftKey && (key === "S" || key === "s")) {
          toast.warn("Screen capture shortcuts are disabled.", { autoClose: 2000 });
          return false;
        }

        if (ctrlKey && (key === "p" || keyCode === 80)) {
          e.preventDefault();
          toast.warn("Printing is disabled.", { autoClose: 2000 });
          return false;
        }

        if (ctrlKey && (key === "s" || keyCode === 83)) {
          e.preventDefault();
          return false;
        }

        if ((ctrlKey && shiftKey && (key === "I" || keyCode === 73)) || key === "F12" || keyCode === 123) {
          e.preventDefault();
          return false;
        }

        if (ctrlKey && (key === "u" || keyCode === 85)) {
          e.preventDefault();
          return false;
        }

        if (ctrlKey && (key === 'c' || keyCode === 67)) {
          e.preventDefault();
          return false;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add("content-blur");
      } else {
        document.body.classList.remove("content-blur");
      }
    };

    const handleWindowBlur = () => {
      document.body.classList.add("content-blur");
    };

    const handleWindowFocus = () => {
      document.body.classList.remove("content-blur");
    };

    window.addEventListener("contextmenu", preventActions);
    window.addEventListener("keydown", preventActions, true);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    document.body.classList.add("select-none", "content-protected");
    const style = document.createElement("style");
    style.id = "protection-styles";
    style.innerHTML = `
      .content-protected {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      .content-blur {
        filter: blur(15px) !important;
        transition: filter 0.2s ease;
      }
      @media print {
        body { display: none !important; visibility: hidden !important; }
      }
      /* Prevent screen capture software from getting clear images in some browsers */
      body::after {
        content: "";
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        z-index: 9999;
        background: rgba(255,255,255,0.001);
      }
    `;
    document.head.appendChild(style);

    const clipboardInterval = setInterval(() => {
      if (document.hidden || !document.hasFocus()) {
        try { navigator.clipboard.writeText(""); } catch(e) { /* empty */ }
      }
    }, 1000);

    return () => {
      window.removeEventListener("contextmenu", preventActions);
      window.removeEventListener("keydown", preventActions, true);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.body.classList.remove("select-none", "content-protected", "content-blur");
      const existingStyle = document.getElementById("protection-styles");
      if (existingStyle) existingStyle.remove();
      clearInterval(clipboardInterval);
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
