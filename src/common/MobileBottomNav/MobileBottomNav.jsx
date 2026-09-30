import { NavLink } from "react-router-dom";
import { FaHome, FaGavel, FaBoxOpen, FaBell, FaTachometerAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import { useMemo } from "react";

const MobileBottomNav = () => {
  const { userRole } = useAuth();
  const { unreadCount } = useNotifications();

  const isAdmin = useMemo(
    () => userRole === "Admin" || userRole === "SuperAdmin" || userRole === "Owner",
    [userRole],
  );
  const isSeller = userRole === "Seller";
  const isEmployee = userRole === "Employee";

  const theme = useMemo(() => {
    if (isAdmin) {
      return {
        activeColor: "text-emerald-600",
        activeBg: "bg-emerald-50",
        activePillBg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
        activeShadow: "shadow-lg shadow-emerald-500/40",
        ringGlow: "ring-emerald-400",
        navBg: "from-white/95 via-emerald-50/90 to-white/95",
        borderColor: "border-emerald-100/60",
      };
    }
    if (isEmployee) {
      return {
        activeColor: "text-indigo-600",
        activeBg: "bg-indigo-50",
        activePillBg: "bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-500",
        activeShadow: "shadow-lg shadow-indigo-500/40",
        ringGlow: "ring-indigo-400",
        navBg: "from-white/95 via-indigo-50/90 to-white/95",
        borderColor: "border-indigo-100/60",
      };
    }
    if (isSeller) {
      return {
        activeColor: "text-emerald-600",
        activeBg: "bg-emerald-50",
        activePillBg: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600",
        activeShadow: "shadow-lg shadow-emerald-500/30",
        ringGlow: "ring-emerald-400",
        navBg: "from-white/95 via-emerald-50/90 to-white/95",
        borderColor: "border-emerald-100/60",
      };
    }
    return {
      activeColor: "text-blue-600",
      activeBg: "bg-blue-50",
      activePillBg: "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600",
      activeShadow: "shadow-lg shadow-blue-500/30",
      ringGlow: "ring-blue-400",
      navBg: "from-white/95 via-blue-50/90 to-white/95",
      borderColor: "border-blue-100/60",
    };
  }, [isAdmin, isEmployee, isSeller]);

  const navItems = [
    { label: "Home", icon: <FaHome className="w-5 h-5" />, path: "/dashboard" },
    {
      label: "Bids",
      icon: <FaGavel className="w-5 h-5" />,
      path: isSeller ? "/Supplier-Bid-List" : "/manage-bids/bid-list",
    },
    {
      label: "Dashboard",
      icon: <FaTachometerAlt className="w-5 h-5" />,
      path: isEmployee ? "/employee/dashboard" : "/dashboard",
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
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-100/95 via-slate-50/70 to-transparent pointer-events-none" />

      <div className="relative mx-2 sm:mx-4 mb-2 sm:mb-3 pb-safe-area-inset-bottom">
        <div
          className={`
          relative overflow-hidden
          bg-gradient-to-br ${theme.navBg} backdrop-blur-2xl
          rounded-[2rem]
          border ${theme.borderColor}
          shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.15),0_15px_50px_-20px_rgba(0,0,0,0.18)]
        `}
        >
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(circle,#000_0.5px,transparent_0.5px)] [background-size:16px_16px]" />

          <div className="flex items-stretch justify-around h-16 sm:h-[74px] max-w-xl mx-auto px-1 sm:px-2 py-1.5 sm:py-2">
            {navItems.map((item, idx) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex-1 flex flex-col items-center justify-center mx-0.5 sm:mx-1 rounded-[1.25rem] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) animate-fade-in-up ${
                    isActive
                      ? `${theme.activeBg} ${theme.activeColor} animate-pop-in`
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/70"
                  }`
                }
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                {({ isActive }) => (
                  <div className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 sm:gap-1">
                    <div
                      className={`
                        relative transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${isActive ? "scale-115 -translate-y-1 animate-bounce-soft" : "scale-100"}
                      `}
                    >
                      <div
                        className={`
                          p-1.5 sm:p-2.5 rounded-[1rem]
                          transition-all duration-500 ease-out
                          ${isActive
                            ? `${theme.activePillBg} text-white ${theme.activeShadow} animate-gradient-border bg-[length:200%_200%] ring-4 ${theme.ringGlow}/10`
                            : "bg-transparent text-inherit"
                          }
                        `}
                      >
                        {item.icon}
                      </div>

                      {item.count > 0 && (
                        <span
                          className={`
                            absolute -top-1.5 -right-2
                            min-w-[20px] h-[20px] px-1
                            bg-gradient-to-br from-red-500 via-rose-500 to-pink-500
                            text-white text-[9px] font-black
                            flex items-center justify-center
                            rounded-full ring-2 ring-white shadow-lg shadow-red-500/40
                            animate-pop-in
                          `}
                        >
                          {item.count > 99 ? "99+" : item.count}
                        </span>
                      )}

                      {isActive && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${theme.activePillBg} animate-ping`} />
                      )}
                    </div>

                    <span
                      className={`
                        text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] leading-none
                        transition-all duration-300
                        ${isActive ? "scale-105 mt-0.5 font-extrabold" : "opacity-90"}
                      `}
                    >
                      {item.label}
                    </span>

                    <div
                      className={`
                        absolute -bottom-0.5 h-1.5 rounded-full
                        transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${isActive
                          ? `w-10 sm:w-12 opacity-100 ${theme.activePillBg} animate-pop-in shadow-md`
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
