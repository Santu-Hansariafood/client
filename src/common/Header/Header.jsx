import { useState, useCallback, useEffect, useRef } from "react";
import { AiOutlineUser } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import PWAInstall from "../PWAInstall/PWAInstall";

const Header = ({ onLogoutClick }) => {
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
      className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 pl-14 pr-4 py-3 sm:py-4 lg:pl-6 lg:pr-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-amber-50 shadow-lg border-b border-amber-400/20"
      role="banner"
    >
      <h1 className="text-base sm:text-xl font-bold tracking-wide truncate max-w-[70vw] sm:max-w-none pr-2">
        {title}
      </h1>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto" ref={dropdownRef}>
        <div className="hidden sm:flex items-center">
          <PWAInstall />
        </div>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 font-medium text-amber-50 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            onClick={toggleDropdown}
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-700 grid place-items-center ring-2 ring-amber-300/70 shrink-0">
              <AiOutlineUser size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <span className="hidden sm:inline text-sm">{profile}</span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="sm:hidden border-b border-slate-100 px-3 py-2">
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
