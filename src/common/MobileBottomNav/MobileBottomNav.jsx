import { NavLink } from "react-router-dom";
import { FaHome, FaGavel, FaBoxOpen, FaBell } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";

const MobileBottomNav = () => {
  const { userRole } = useAuth();
  const { unreadCount } = useNotifications();

  const isSeller = userRole === "Seller";
  const activeColor = isSeller ? "text-emerald-600" : "text-blue-600";
  const activeBg = isSeller ? "bg-emerald-50" : "bg-blue-50";
  const activePillBg = isSeller
    ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600"
    : "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600";
  const activeShadow = isSeller
    ? "shadow-lg shadow-emerald-500/30"
    : "shadow-lg shadow-blue-500/30";

  const navItems = [
    { label: "Home", icon: <FaHome className="w-5 h-5" />, path: "/dashboard" },
    {
      label: "Bids",
      icon: <FaGavel className="w-5 h-5" />,
      path: isSeller ? "/Supplier-Bid-List" : "/manage-bids/bid-list",
    },
    {
      label: "Orders",
      icon: <FaBoxOpen className="w-5 h-5" />,
      path: "/manage-order/list-self-order",
    },
    { label: "Alerts", icon: <FaBell className="w-5 h-5" />, path: "/alerts", count: unreadCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom animate-slide-up [animation-delay:200ms]">
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50/90 via-slate-50/60 to-transparent pointer-events-none" />

      <div className="relative mx-3 sm:mx-4 mb-2 sm:mb-3 pb-safe-area-inset-bottom">
        <div className="
          relative overflow-hidden
          bg-white/90 backdrop-blur-2xl
          rounded-3xl
          border border-white/80
          shadow-[0_-8px_32px_-10px_rgba(0,0,0,0.12),0_10px_40px_-15px_rgba(0,0,0,0.15)]
        ">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="flex items-stretch justify-around h-16 sm:h-[70px] max-w-xl mx-auto px-1.5 sm:px-2 py-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex-1 flex flex-col items-center justify-center mx-0.5 sm:mx-1 rounded-2xl transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                    isActive
                      ? `${activeBg} ${activeColor} animate-pop-in`
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/80"
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="relative flex flex-col items-center justify-center w-full h-full gap-0.5">
                    <div
                      className={`
                        relative transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${isActive ? "scale-115 -translate-y-0.5 animate-bounce-soft" : "scale-100"}
                      `}
                    >
                      <div
                        className={`
                          p-1.5 sm:p-2 rounded-2xl
                          transition-all duration-400 ease-out
                          ${isActive
                            ? `${activePillBg} text-white ${activeShadow} animate-gradient-border bg-[length:200%_200%]`
                            : "bg-transparent text-inherit"
                          }
                        `}
                      >
                        {item.icon}
                      </div>

                      {item.count > 0 && (
                        <span
                          className={`
                            absolute -top-1 -right-1.5
                            min-w-[18px] h-[18px] px-1
                            bg-gradient-to-br from-red-500 via-rose-500 to-pink-500
                            text-white text-[9px] font-black
                            flex items-center justify-center
                            rounded-full ring-2 ring-white shadow-md shadow-red-500/30
                            animate-pop-in
                          `}
                        >
                          {item.count > 99 ? "99+" : item.count}
                        </span>
                      )}
                    </div>

                    <span
                      className={`
                        text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] leading-none
                        transition-all duration-300
                        ${isActive ? "scale-105 mt-0.5" : "opacity-90"}
                      `}
                    >
                      {item.label}
                    </span>

                    <div
                      className={`
                        absolute -bottom-0.5 h-1 rounded-full
                        transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${isActive
                          ? `w-8 sm:w-10 opacity-100 ${activePillBg} animate-pop-in`
                          : "w-2 opacity-0 bg-slate-300"
                        }
                      `}
                    />
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
