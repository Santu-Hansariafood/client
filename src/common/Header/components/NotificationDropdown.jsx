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
    markAllRead,
    deleteNotification: deleteNotificationFromContext,
  } = useNotifications();

  const [unreadOnly, setUnreadOnly] = useState(true);

  const filteredNotifications = useMemo(() => {
    return unreadOnly ? notifications.filter((n) => !n.isRead) : notifications;
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

          <div className="flex border-b border-slate-100">
            <button
              className={`flex-1 py-2.5 text-xs font-bold transition ${
                unreadOnly ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500"
              }`}
              onClick={() => setUnreadOnly(true)}
            >
              Unread
            </button>
            <button
              className={`flex-1 py-2.5 text-xs font-bold transition ${
                !unreadOnly ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500"
              }`}
              onClick={() => setUnreadOnly(false)}
            >
              All
            </button>
          </div>

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
                      <h4 className={`text-sm font-bold truncate ${!n.isRead ? "text-emerald-700" : "text-slate-700"}`}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
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
                        {n.isRead ? <AiOutlineEyeInvisible size={15} /> : <AiOutlineEye size={15} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotificationFromContext(n._id);
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
              <div className="p-10 text-center text-slate-400 text-sm">No notifications found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
