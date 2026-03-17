import { useState, useCallback, useEffect, useRef } from "react";
import { AiOutlineUser } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import PWAInstall from "../PWAInstall/PWAInstall";
import Typewriter from "../Typewriter/Typewriter";

const Header = ({
  onLogoutClick,
  showMenuButton,
  onMenuClick,
  isSidebarOpen,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const title = "Hansaria Food Private Limited";
  const profile = "Profile";
  const logout = "Logout";

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-amber-50 shadow-lg border-b border-amber-400/20"
      role="banner"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {showMenuButton && (
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 mr-1"
            onClick={onMenuClick}
            aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
          >
            {isSidebarOpen ? <IoClose size={24} /> : <HiMenuAlt2 size={24} />}
          </button>
        )}
        <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold tracking-wide truncate pr-1">
          <Typewriter text={title} speed={80} />
        </h2>
      </div>
      <div
        className="flex items-center gap-1.5 sm:gap-3 shrink-0"
        ref={dropdownRef}
      >
        <div className="hidden md:flex items-center">
          <PWAInstall />
        </div>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 font-medium text-amber-50 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            onClick={toggleDropdown}
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-emerald-700 grid place-items-center ring-1.5 sm:ring-2 ring-amber-300/70 shrink-0">
              <AiOutlineUser
                size={18}
                className="sm:w-[20px] sm:h-[20px] md:w-[22px] md:h-[22px]"
              />
            </div>
            <span className="hidden sm:inline text-xs sm:text-sm">
              {profile}
            </span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="md:hidden border-b border-slate-100 px-3 py-2">
                <PWAInstall />
              </div>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                onClick={() => {
                  setShowDropdown(false);
                  onLogoutClick?.();
                }}
              >
                <RiLogoutBoxLine size={20} />
                <span>{logout}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
