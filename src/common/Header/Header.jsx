import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineUser,
  AiOutlineBell,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineDelete,
  AiOutlineLock,
} from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

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

  const filteredNotifications = useMemo(() => {
    return unreadOnly ? notifications.filter((n) => !n.isRead) : notifications;
  }, [notifications, unreadOnly]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setProfileDropdownOpen((prev) => !prev);
    setShowNotifications(false);
  }, [setProfileDropdownOpen]);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => !prev);
    setProfileDropdownOpen(false);
  }, [setProfileDropdownOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    setShowNotifications(false);

    if (userRole === "Admin" || userRole === "Employee") {
      navigate("/manage-bids/bid-list/participate-bid-admin");
    } else {
      navigate("/participate-bid-list");
    }
  };

  const deleteNotification = async (id) => {
    await deleteNotificationFromContext(id);
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen, showNotifications, setProfileDropdownOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between px-3 sm:px-5 lg:px-6 h-16 sm:h-[72px]">
          <div className="flex items-center gap-3 min-w-0">
            {showMenuButton && (
              <button
                type="button"
                onClick={onMenuClick}
                aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                {isSidebarOpen ? (
                  <IoClose size={24} />
                ) : (
                  <HiMenuAlt2 size={24} />
                )}
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-black uppercase italic tracking-tight text-white truncate">
                <Typewriter text="Hansaria Food Private Limited" speed={70} />
              </h1>

              <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-emerald-200 font-bold">
                Logistics & Bid Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <PWAInstall />
            </div>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                <AiOutlineBell size={22} className="text-white" />

                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-emerald-900">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[340px] sm:w-[390px] max-w-[95vw] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-slate-800">
                        Notifications
                      </h3>

                      <p className="text-xs text-slate-500">
                        {unreadCount} unread messages
                      </p>
                    </div>

                    <button
                      onClick={markAllRead}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Mark all
                    </button>
                  </div>

                  <div className="flex border-b border-slate-100">
                    <button
                      className={`flex-1 py-2.5 text-xs font-bold transition ${
                        unreadOnly
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-slate-500"
                      }`}
                      onClick={() => setUnreadOnly(true)}
                    >
                      Unread
                    </button>

                    <button
                      className={`flex-1 py-2.5 text-xs font-bold transition ${
                        !unreadOnly
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-slate-500"
                      }`}
                      onClick={() => setUnreadOnly(false)}
                    >
                      All
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[420px] overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`group p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
                            !n.isRead ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <div className="flex justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-bold truncate ${
                                  !n.isRead
                                    ? "text-emerald-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {n.title}
                              </h4>

                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {n.message}
                              </p>

                              <span className="text-[10px] text-slate-400 mt-2 inline-block">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n._id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white"
                              >
                                {n.isRead ? (
                                  <AiOutlineEyeInvisible size={15} />
                                ) : (
                                  <AiOutlineEye size={15} />
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                              >
                                <AiOutlineDelete size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        No notifications found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-amber-300 flex items-center justify-center shadow-md">
                  <AiOutlineUser size={20} className="text-white" />
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs text-emerald-100 font-bold">
                    {userRole}
                  </span>

                  <span className="text-[11px] text-white font-medium max-w-[120px] truncate">
                    {mobile}
                  </span>
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs uppercase text-slate-400 font-bold">
                      Logged In As
                    </p>

                    <h4 className="font-black text-slate-700 mt-1 truncate">
                      {mobile}
                    </h4>

                    <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {userRole}
                    </span>
                  </div>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-slate-50 transition"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setChangePasswordOpen(true);
                    }}
                  >
                    <AiOutlineLock size={18} />
                    Change Password
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition border-t border-slate-100"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogoutClick?.();
                    }}
                  >
                    <RiLogoutBoxLine size={18} />
                    Logout
                  </button>

                  <div className="md:hidden border-t border-slate-100 p-3">
                    <PWAInstall />
                  </div>
                </div>
              )}
            </div>
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
