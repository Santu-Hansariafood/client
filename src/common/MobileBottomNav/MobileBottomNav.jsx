import { NavLink } from "react-router-dom";
import { FaHome, FaGavel, FaBoxOpen, FaUser, FaBell } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";

const MobileBottomNav = () => {
  const { userRole } = useAuth();
  const { unreadCount } = useNotifications();

  const activeColor = userRole === "Seller" ? "text-emerald-600" : "text-blue-600";
  const activeDotColor = userRole === "Seller" ? "bg-emerald-600" : "bg-blue-600";

  const navItems = [
    { label: "Home", icon: <FaHome />, path: "/dashboard" },
    { 
      label: "Bids", 
      icon: <FaGavel />, 
      path: userRole === "Seller" ? "/Supplier-Bid-List" : "/manage-bids/bid-list" 
    },
    { 
      label: "Orders", 
      icon: <FaBoxOpen />, 
      path: "/manage-order/list-self-order" 
    },
    { label: "Alerts", icon: <FaBell />, path: "/alerts", count: unreadCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-200 px-2 pb-safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
                isActive ? `${activeColor} scale-110` : "text-slate-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-xl">
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                  {item.label}
                </span>
                {item.count > 0 && (
                  <span className="absolute top-2 right-1/2 translate-x-4 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                    {item.count}
                  </span>
                )}
                {/* Active Indicator Dot */}
                <div
                  className={`absolute -bottom-1 w-1 h-1 rounded-full transition-all duration-300 ${
                    isActive ? `opacity-100 ${activeDotColor}` : "opacity-0"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
