import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHome, FaUser } from "react-icons/fa";

const MobileFooter = ({ onProfileClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "back",
      label: "Back",
      icon: FaArrowLeft,
      onClick: () => navigate(-1),
      isActive: false,
    },
    {
      id: "home",
      label: "Home",
      icon: FaHome,
      onClick: () => navigate("/dashboard"),
      isActive: location.pathname === "/dashboard",
    },
    {
      id: "profile",
      label: "Profile",
      icon: FaUser,
      onClick: onProfileClick,
      isActive: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 md:hidden">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 shadow-[0_-5px_25px_rgba(0,0,0,0.15)]" />

      <div className="relative flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`group flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 active:scale-90 ${
                item.isActive ? "text-blue-700" : "text-slate-500"
              }`}
            >
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 ${
                  item.isActive
                    ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg scale-110"
                    : "bg-white border border-slate-200 group-hover:bg-blue-50"
                }`}
              >
                <Icon size={17} />
              </div>

              <span
                className={`text-[11px] font-semibold ${
                  item.isActive
                    ? "text-blue-700"
                    : "text-slate-500 group-hover:text-blue-600"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileFooter;
