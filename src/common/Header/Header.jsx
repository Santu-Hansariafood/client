import { useState, useEffect, useRef, useMemo } from "react";
import PWAInstall from "../PWAInstall/PWAInstall";
import ChangePasswordModal from "./ChangePasswordModal";
import WeatherWidget from "./components/WeatherWidget";
import NotificationDropdown from "./components/NotificationDropdown";
import ProfileDropdown from "./components/ProfileDropdown";
import HeaderBranding from "./components/HeaderBranding";
import { useAuth } from "../../context/AuthContext/AuthContext";

const Header = ({
  onLogoutClick,
  showMenuButton,
  onMenuClick,
  isSidebarOpen,
  isProfileDropdownOpen,
  setProfileDropdownOpen,
}) => {
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { userRole, user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = useMemo(
    () => userRole === "Admin" || userRole === "SuperAdmin" || userRole === "Owner",
    [userRole],
  );
  const isEmployee = useMemo(() => userRole === "Employee", [userRole]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (isProfileDropdownOpen || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen, showNotifications, setProfileDropdownOpen]);

  const headerGradient = useMemo(() => {
    if (isAdmin) return "from-emerald-900 via-emerald-800 to-teal-900";
    if (isEmployee) return "from-indigo-900 via-indigo-800 to-violet-900";
    return "from-blue-900 via-blue-800 to-indigo-900";
  }, [isAdmin, isEmployee]);

  const accentGlow = useMemo(() => {
    if (isAdmin) return "from-emerald-400/40 via-teal-400/30 to-emerald-400/40";
    if (isEmployee) return "from-indigo-400/40 via-blue-400/30 to-violet-400/40";
    return "from-blue-400/40 via-indigo-400/30 to-purple-400/40";
  }, [isAdmin, isEmployee]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r ${headerGradient} backdrop-blur-2xl animate-slide-down relative transition-all duration-500 ${
          scrolled ? "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]" : "shadow-lg"
        }`}
      >
        <div className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-${accentGlow} to-transparent pointer-events-none opacity-60`} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_20%_50%,#ffffff_0.5px,transparent_1px)] [background-size:20px_20px]" />

        <div className="flex items-center justify-between px-3 sm:px-5 lg:px-6 h-16 sm:h-[72px] relative z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <HeaderBranding
              showMenuButton={showMenuButton}
              onMenuClick={onMenuClick}
              isSidebarOpen={isSidebarOpen}
            />

            <div className="hidden xl:flex items-center gap-2 ml-6 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3 animate-pulse" />
              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                Live Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="hidden md:block">
              <WeatherWidget />
            </div>

            <div className="hidden lg:block">
              <PWAInstall />
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${isAdmin ? "from-emerald-500 to-teal-600" : isEmployee ? "from-indigo-500 to-blue-600" : "from-blue-500 to-indigo-600"} flex items-center justify-center text-white text-[10px] font-black shadow-lg`}>
                {user?.name?.charAt?.(0) || "U"}
              </div>
              <div className="hidden xl:block">
                <p className="text-white text-[11px] font-bold leading-tight truncate max-w-[120px]">
                  {user?.name || "User"}
                </p>
                <p className="text-white/50 text-[9px] font-black uppercase tracking-wider leading-tight">
                  {userRole || "Guest"}
                </p>
              </div>
            </div>

            <NotificationDropdown
              notificationRef={notificationRef}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              setProfileDropdownOpen={setProfileDropdownOpen}
            />

            <ProfileDropdown
              dropdownRef={dropdownRef}
              isProfileDropdownOpen={isProfileDropdownOpen}
              setProfileDropdownOpen={setProfileDropdownOpen}
              setShowNotifications={setShowNotifications}
              onLogoutClick={onLogoutClick}
              setChangePasswordOpen={setChangePasswordOpen}
            />
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
};

export default Header;
