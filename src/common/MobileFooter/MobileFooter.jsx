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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="h-3" />

      <div className="relative mx-auto max-w-md">
        <div className="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.25)]" />

        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-cyan-400/20 blur-xl opacity-70" />

        <div className="relative flex items-center justify-around px-2 py-2.5">
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
                {/* 🔥 ICON CONTAINER */}
                <div
                  className={`relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 ${
                    item.isActive
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg scale-110"
                      : "bg-white/80 border border-slate-200 group-hover:bg-blue-50"
                  }`}
                >
                  <Icon size={17} />

                  {item.isActive && (
                    <span className="absolute inset-0 rounded-xl bg-blue-400 blur-md opacity-40" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-semibold transition-all duration-300 ${
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
    </div>
  );
};

export default MobileFooter;
