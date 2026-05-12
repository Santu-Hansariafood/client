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
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-all duration-200"
        >
          {isSidebarOpen ? <IoClose size={24} /> : <HiMenuAlt2 size={24} />}
        </button>
      )}

      <div className="min-w-0">
        <h1 className="text-sm sm:text-lg md:text-xl font-black uppercase italic tracking-tight text-white truncate">
          <Typewriter text="Hansaria Food Private Limited" speed={70} />
        </h1>
        <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-emerald-200 font-bold">
          Logistics & Bid Management
        </p>
      </div>
    </div>
  );
};

export default HeaderBranding;
