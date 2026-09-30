import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { useMemo } from "react";
import Typewriter from "../../Typewriter/Typewriter";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const HeaderBranding = ({ showMenuButton, onMenuClick, isSidebarOpen }) => {
  const { userRole } = useAuth();

  const isAdmin = useMemo(
    () => userRole === "Admin" || userRole === "SuperAdmin" || userRole === "Owner",
    [userRole],
  );
  const isEmployee = useMemo(() => userRole === "Employee", [userRole]);

  const accentColor = useMemo(() => {
    if (isAdmin) return "text-emerald-200";
    if (isEmployee) return "text-indigo-200";
    return "text-emerald-200";
  }, [isAdmin, isEmployee]);

  const accentGlow = useMemo(() => {
    if (isAdmin) return "shadow-[0_0_10px_rgba(52,211,153,0.7)]";
    if (isEmployee) return "shadow-[0_0_10px_rgba(129,140,248,0.7)]";
    return "shadow-[0_0_10px_rgba(52,211,153,0.7)]";
  }, [isAdmin, isEmployee]);

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      {showMenuButton && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
          className="group flex items-center justify-center w-11 h-11 rounded-2xl hover:bg-white/15 active:scale-90 focus-visible:ring-2 focus-visible:ring-white/40 focus:outline-none transition-all duration-300 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20"
        >
          <span
            key={isSidebarOpen ? "close" : "menu"}
            className="animate-pop-in inline-flex text-white group-hover:scale-110 transition-transform"
          >
            {isSidebarOpen ? <IoClose size={22} /> : <HiMenuAlt2 size={24} />}
          </span>
        </button>
      )}

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`hidden sm:flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 shadow-lg animate-hover-float`}>
          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-300 animate-pulseSlow ${accentGlow}`} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] sm:text-lg md:text-xl font-black uppercase tracking-tight text-white truncate leading-tight">
            <span className="sm:hidden font-black">Hansaria Food</span>
            <span className="hidden sm:inline bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              <Typewriter text="Hansaria Food Private Limited" speed={70} />
              <span
                className={`inline-block w-[2.5px] h-[1em] ml-1 ${isEmployee ? "bg-indigo-300" : "bg-emerald-300"} align-middle animate-pulse ${accentGlow}`}
              />
            </span>
          </h1>
          <p
            className={`hidden sm:block text-[10px] sm:text-[11px] uppercase tracking-[0.2em] ${accentColor} font-black mt-1 inline-flex items-center gap-1.5`}
          >
            <span className="w-1 h-1 rounded-full bg-current animate-pulseSlow" />
            Logistics & Bid Management
            <span className="w-1 h-1 rounded-full bg-current animate-pulseSlow" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeaderBranding;
