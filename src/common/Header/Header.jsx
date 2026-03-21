import { useState, useCallback, useEffect, useRef } from "react";
import { AiOutlineUser, AiOutlineBell } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import axios from "axios";
import PWAInstall from "../PWAInstall/PWAInstall";
import Typewriter from "../Typewriter/Typewriter";
import { useAuth } from "../../context/AuthContext/AuthContext";

const Header = ({
  onLogoutClick,
  showMenuButton,
  onMenuClick,
  isSidebarOpen,
  isProfileDropdownOpen,
  setProfileDropdownOpen,
}) => {
  const { userRole, mobile } = useAuth();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get("/notifications", {
        params: { mobile, role: userRole }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, [mobile, userRole]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const toggleDropdown = useCallback(() => {
    setProfileDropdownOpen(prev => !prev);
    setShowNotifications(false);
  }, [setProfileDropdownOpen]);

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    setProfileDropdownOpen(false);
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (isProfileDropdownOpen || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen, showNotifications, setProfileDropdownOpen]);

  const title = "Hansaria Food Private Limited";
  const profile = "Profile";
  const logout = "Logout";

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-amber-50 shadow-lg border-b border-amber-400/20"
      role="banner"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {showMenuButton && (
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 mr-1"
            onClick={onMenuClick}
            aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
          >
            {isSidebarOpen ? <IoClose size={24} /> : <HiMenuAlt2 size={24} />}
          </button>
        )}
        <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold tracking-wide truncate pr-1">
          <Typewriter text={title} speed={80} />
        </h2>
      </div>
      <div
        className="flex items-center gap-1.5 sm:gap-3 shrink-0"
      >
        <div className="hidden md:flex items-center">
          <PWAInstall />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="p-2 rounded-xl text-amber-50 hover:bg-white/10 transition-colors relative"
            onClick={toggleNotifications}
          >
            <AiOutlineBell size={24} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-emerald-800">
                {notifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30">
              <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                <span>Notifications</span>
                <span className="text-xs font-normal text-slate-500">{notifications.length} new</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer group"
                      onClick={() => markAsRead(n._id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-emerald-700">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm italic">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 font-medium text-amber-50 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            onClick={toggleDropdown}
            aria-expanded={isProfileDropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-emerald-700 grid place-items-center ring-1.5 sm:ring-2 ring-amber-300/70 shrink-0">
              <AiOutlineUser
                size={18}
                className="sm:w-[20px] sm:h-[20px] md:w-[22px] md:h-[22px]"
              />
            </div>
            <span className="hidden sm:inline text-xs sm:text-sm">
              {profile}
            </span>
          </button>
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="md:hidden border-b border-slate-100 px-3 py-2">
                <PWAInstall />
              </div>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onLogoutClick?.();
                }}
              >
                <RiLogoutBoxLine size={20} />
                <span>{logout}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
