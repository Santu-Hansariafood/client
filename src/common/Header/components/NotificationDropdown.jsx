import { useState, useCallback, useMemo } from "react";
import {
  AiOutlineBell,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineDelete,
} from "react-icons/ai";
import { useNotifications } from "../../../context/NotificationContext/NotificationContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const NotificationDropdown = ({
  notificationRef,
  showNotifications,
  setShowNotifications,
  setProfileDropdownOpen,
}) => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    toggleReadStatus,
    markAllRead,
    deleteNotification: deleteNotificationFromContext,
  } = useNotifications();

  const [unreadOnly, setUnreadOnly] = useState(true);

  const groupedNotifications = useMemo(() => {
    const filtered = unreadOnly
      ? notifications.filter((n) => !n.isRead)
      : notifications;

    const groups = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    filtered.forEach((n) => {
      const date = new Date(n.createdAt).toLocaleDateString();
      let label = date;
      if (date === today) label = "Today";
      else if (date === yesterday) label = "Yesterday";

      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });

    return groups;
  }, [notifications, unreadOnly]);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => {
      const newState = !prev;
      if (newState) {
        fetchNotifications(false);
      }
      return newState;
    });
    setProfileDropdownOpen(false);
  }, [setShowNotifications, setProfileDropdownOpen, fetchNotifications]);

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

  return (
    <div className="relative" ref={notificationRef}>
      <button
        type="button"
        onClick={toggleNotifications}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus:outline-none transition-all duration-200"
      >
        <AiOutlineBell size={22} className={`text-white ${unreadCount > 0 ? "animate-bounce-soft" : ""}`} />
        {unreadCount > 0 && (
          <span key={unreadCount} className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-lux-cream animate-pop-in">
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-3 w-[340px] sm:w-[390px] max-w-[95vw] bg-lux-cream rounded-3xl shadow-[0_24px_50px_-30px_rgba(6,95,70,0.45)] border border-[#e9e2d3] overflow-hidden z-50 animate-slide-down animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-lux-ivory border-b border-[#ece4d2]">
            <div>
              <h3 className="font-serif font-bold text-lux-ink">Notifications</h3>
              <p className="text-xs text-lux-muted">
                {unreadCount} unread messages
              </p>
            </div>
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-lux-emerald hover:text-lux-deep"
            >
              Mark all
            </button>
          </div>

          <div className="flex border-b border-[#ece4d2] bg-lux-ivory/50 p-1.5 gap-1">
            <button
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                unreadOnly
                  ? "bg-lux-cream text-lux-gold shadow-sm scale-[1.02]"
                  : "text-lux-muted hover:text-lux-ink hover:bg-[#f2eee2]"
              }`}
              onClick={() => setUnreadOnly(true)}
            >
              Unread ({notifications.filter((n) => !n.isRead).length})
            </button>
            <button
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                !unreadOnly
                  ? "bg-lux-cream text-lux-gold shadow-sm scale-[1.02]"
                  : "text-lux-muted hover:text-lux-ink hover:bg-[#f2eee2]"
              }`}
              onClick={() => setUnreadOnly(false)}
            >
              All ({notifications.length})
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {Object.keys(groupedNotifications).length > 0 ? (
              (() => {
                let globalIdx = 0;
                return Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date}>
                    <div className="sticky top-0 z-10 bg-lux-ivory/90 backdrop-blur-sm px-4 py-2 border-b border-[#ece4d2]">
                      <span className="text-[10px] font-black text-lux-muted uppercase tracking-[0.2em]">
                        {date}
                      </span>
                    </div>
                    {items.map((n) => {
                      const currentIdx = globalIdx;
                      globalIdx++;
                      const staggerClass = `stagger-${Math.min(currentIdx + 1, 8)}`;
                      return (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`group p-4 border-b border-[#ece4d2] cursor-pointer transition-all hover:bg-lux-ivory animate-card-stagger ${staggerClass} ${
                            !n.isRead ? "bg-[#f2eee2]" : ""
                          }`}
                        >
                          <div className="flex justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-lux-gold shadow-[0_0_8px_rgba(201,162,39,0.5)] animate-pulse" />
                                )}
                                <h4
                                  className={`text-sm font-bold truncate ${!n.isRead ? "text-lux-emerald" : "text-lux-ink"}`}
                                >
                                  {n.title}
                                </h4>
                              </div>
                              <p className="text-xs text-lux-muted line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold text-lux-muted">
                                  {new Date(n.createdAt).toLocaleTimeString(
                                    "en-IN",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                                {n.type && (
                                  <span className="text-[9px] font-black text-lux-gold bg-[#f2eee2] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    {n.type.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReadStatus(n._id);
                                }}
                                title={n.isRead ? "Mark as unread" : "Mark as read"}
                                className="p-1.5 rounded-lg hover:bg-lux-cream text-lux-muted hover:text-lux-gold transition-colors shadow-sm border border-transparent hover:border-[#ece4d2] focus-visible:ring-2 focus-visible:ring-lux-gold/40 focus:outline-none w-9 h-9 flex items-center justify-center"
                              >
                                {n.isRead ? (
                                  <AiOutlineEyeInvisible size={16} />
                                ) : (
                                  <AiOutlineEye size={16} />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotificationFromContext(n._id);
                                }}
                                title="Delete notification"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-lux-muted hover:text-red-500 transition-colors shadow-sm border border-transparent hover:border-[#ece4d2] focus-visible:ring-2 focus-visible:ring-red-400 focus:outline-none w-9 h-9 flex items-center justify-center"
                              >
                                <AiOutlineDelete size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()
            ) : (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-lux-ivory rounded-full flex items-center justify-center text-[#e6dcc4]">
                  <AiOutlineBell size={32} />
                </div>
                <div>
                  <p className="text-sm font-black text-lux-muted uppercase tracking-widest">
                    No notifications
                  </p>
                  <p className="text-[10px] font-bold text-[#dccfa8] uppercase tracking-tighter mt-1">
                    Check back later for updates
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
