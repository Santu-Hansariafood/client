import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import Typewriter from "../../Typewriter/Typewriter";

const HeaderBranding = ({ showMenuButton, onMenuClick, isSidebarOpen }) => {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {showMenuButton && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/15 active:scale-90 focus-visible:ring-2 focus-visible:ring-white/40 focus:outline-none transition-all duration-300"
        >
          <span key={isSidebarOpen ? "close" : "menu"} className="animate-pop-in inline-flex">
            {isSidebarOpen ? <IoClose size={24} /> : <HiMenuAlt2 size={24} />}
          </span>
        </button>
      )}

      <div className="min-w-0">
        <h1 className="text-sm sm:text-lg md:text-xl font-black uppercase italic tracking-tight text-white truncate">
          <span className="sm:hidden">Hansaria Food</span>
          <span className="hidden sm:inline">
            <Typewriter text="Hansaria Food Private Limited" speed={70} />
            <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-emerald-300 align-middle animate-pulse shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
          </span>
        </h1>
        <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-emerald-200 font-bold">
          Logistics & Bid Management
        </p>
      </div>
    </div>
  );
};

export default HeaderBranding;
