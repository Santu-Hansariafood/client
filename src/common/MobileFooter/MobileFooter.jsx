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
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-2xl border border-white/70 bg-gradient-to-b from-white/95 via-white/90 to-emerald-50/70 backdrop-blur-xl shadow-[0_-12px_32px_-14px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-slate-300/80" />
        </div>
        <div className="flex items-center justify-around px-2 pb-2.5 pt-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`group flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${
                  item.isActive
                    ? "text-emerald-700"
                    : "text-slate-500 hover:text-emerald-700"
                }`}
                aria-label={item.label}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
                    item.isActive
                      ? "bg-emerald-100 border-emerald-200 shadow-sm shadow-emerald-900/10"
                      : "bg-white/80 border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-200"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="text-[11px] font-semibold tracking-wide">
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
