import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineUser,
  AiOutlineBell,
  AiOutlineCheckCircle,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineDelete,
} from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import { AiOutlineLock } from "react-icons/ai";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import api from "../../utils/apiClient/apiClient";
import PWAInstall from "../PWAInstall/PWAInstall";
import Typewriter from "../Typewriter/Typewriter";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import ChangePasswordModal from "./ChangePasswordModal";

const Header = ({
  onLogoutClick,
  showMenuButton,
  onMenuClick,
  isSidebarOpen,
  isProfileDropdownOpen,
  setProfileDropdownOpen,
}) => {
  const { userRole, mobile } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    deleteNotification: deleteNotificationFromContext,
  } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  const filteredNotifications = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setProfileDropdownOpen((prev) => !prev);
    setShowNotifications(false);
  }, [setProfileDropdownOpen]);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setProfileDropdownOpen(false);
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    setShowNotifications(false);

    if (userRole === "Admin" || userRole === "Employee") {
      navigate("/manage-bids/bid-list/participate-bid-admin");
    } else if (userRole === "Buyer") {
      navigate("/participate-bid-list");
    }
  };

  const deleteNotification = async (id) => {
    await deleteNotificationFromContext(id);
  };

  const markAllAsRead = async () => {
    await markAllRead();
  };

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
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center">
          <PWAInstall />
        </div>

        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="p-2 rounded-xl text-amber-50 hover:bg-white/10 transition-colors relative"
            onClick={toggleNotifications}
          >
            <AiOutlineBell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-emerald-800">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30">
              <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-normal text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <AiOutlineCheckCircle size={14} />
                    Mark all
                  </button>
                </div>
              </div>

              <div className="flex border-b border-slate-100 bg-white">
                <button
                  className={`flex-1 py-2 text-xs font-medium ${unreadOnly ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setUnreadOnly(true)}
                >
                  Unread
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-medium ${!unreadOnly ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setUnreadOnly(false)}
                >
                  All
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer group transition-colors ${!n.isRead ? "bg-emerald-50/30" : ""}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-sm font-bold ${!n.isRead ? "text-emerald-700" : "text-slate-600"}`}
                        >
                          {n.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n._id);
                              }}
                              className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-emerald-600 transition-colors"
                              title={
                                n.isRead ? "Mark as unread" : "Mark as read"
                              }
                            >
                              {n.isRead ? (
                                <AiOutlineEyeInvisible size={14} />
                              ) : (
                                <AiOutlineEye size={14} />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n._id);
                              }}
                              className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete notification"
                            >
                              <AiOutlineDelete size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p
                        className={`text-xs ${!n.isRead ? "text-slate-700" : "text-slate-500"} line-clamp-2`}
                      >
                        {n.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm italic">
                    No {unreadOnly ? "unread" : ""} notifications
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
            <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Logged in as
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {mobile}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 mt-1">
                  {userRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 text-sm font-medium transition-colors"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setChangePasswordOpen(true);
                  }}
                >
                  <AiOutlineLock size={18} className="text-slate-400" />
                  <span>Change Password</span>
                </button>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 text-sm font-medium transition-colors"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogoutClick?.();
                  }}
                >
                  <RiLogoutBoxLine size={18} />
                  <span>{logout}</span>
                </button>
              </div>

              <div className="md:hidden border-t border-slate-100 px-3 py-2 bg-slate-50/30">
                <PWAInstall />
              </div>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </header>
  );
};

export default Header;
