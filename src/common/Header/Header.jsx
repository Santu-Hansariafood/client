import { useState, useCallback } from "react";
import { AiOutlineUser } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import PWAInstall from "../PWAInstall/PWAInstall";

const Header = ({ onLogoutClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const title = "Hansaria Food Private Limited";
  const profile = "Profile";
  const logout = "Logout";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-green-800 text-yellow-100 shadow-lg rounded-b-2xl border-b border-yellow-400/40">
      <h1 className="text-xl font-extrabold tracking-wide">{title}</h1>
      <div className="relative">
        <div className="hidden sm:flex items-center gap-3 mr-3">
          <PWAInstall />
        </div>
        <button
          className="flex items-center space-x-2 font-medium text-yellow-100 hover:text-yellow-50"
          onClick={toggleDropdown}
        >
          <div className="w-10 h-10 rounded-full bg-green-700 grid place-items-center ring-2 ring-yellow-300/80">
            <AiOutlineUser size={22} />
          </div>
          <span className="hidden sm:inline">{profile}</span>
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-yellow-300 rounded-md shadow-xl overflow-hidden">
            <button
              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
              onClick={onLogoutClick}
            >
              <RiLogoutBoxLine size={20} />
              <span>{logout}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
