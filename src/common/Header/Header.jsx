import { useState, useEffect, useRef } from "react";
import PWAInstall from "../PWAInstall/PWAInstall";
import ChangePasswordModal from "./ChangePasswordModal";
import WeatherWidget from "./components/WeatherWidget";
import NotificationDropdown from "./components/NotificationDropdown";
import ProfileDropdown from "./components/ProfileDropdown";
import HeaderBranding from "./components/HeaderBranding";

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

  const [showNotifications, setShowNotifications] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between px-3 sm:px-5 lg:px-6 h-16 sm:h-[72px]">
          <HeaderBranding
            showMenuButton={showMenuButton}
            onMenuClick={onMenuClick}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="flex items-center gap-2 sm:gap-3">
            <WeatherWidget />

            <div className="hidden md:block">
              <PWAInstall />
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
