import { useState, useCallback, useMemo } from "react";
import { AiOutlineBell, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineDelete } from "react-icons/ai";
import { useNotifications } from "../../../context/NotificationContext/NotificationContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const NotificationDropdown = ({ notificationRef, showNotifications, setShowNotifications, setProfileDropdownOpen }) => {
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
    const filtered = unreadOnly ? notifications.filter((n) => !n.isRead) : notifications;
    
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
              <h3 className="font-black text-slate-800">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} unread messages</p>
            </div>
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Mark all
            </button>
          </div>

          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
            <button
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                unreadOnly
                  ? "bg-white text-emerald-600 shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
              onClick={() => setUnreadOnly(true)}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
            <button
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                !unreadOnly
                  ? "bg-white text-emerald-600 shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
              onClick={() => setUnreadOnly(false)}
            >
              All ({notifications.length})
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {Object.keys(groupedNotifications).length > 0 ? (
              Object.entries(groupedNotifications).map(([date, items]) => (
                <div key={date}>
                  <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm px-4 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {date}
                    </span>
                  </div>
                  {items.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`group p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
                        !n.isRead ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            )}
                            <h4 className={`text-sm font-bold truncate ${!n.isRead ? "text-emerald-700" : "text-slate-700"}`}>
                              {n.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {n.type && (
                              <span className="text-[9px] font-black text-emerald-600/70 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {n.type.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReadStatus(n._id);
                            }}
                            title={n.isRead ? "Mark as unread" : "Mark as read"}
                            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-emerald-600 transition-colors shadow-sm border border-transparent hover:border-slate-100"
                          >
                            {n.isRead ? <AiOutlineEyeInvisible size={16} /> : <AiOutlineEye size={16} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationFromContext(n._id);
                            }}
                            title="Delete notification"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shadow-sm border border-transparent hover:border-slate-100"
                          >
                            <AiOutlineDelete size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <AiOutlineBell size={32} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No notifications</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Check back later for updates</p>
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
