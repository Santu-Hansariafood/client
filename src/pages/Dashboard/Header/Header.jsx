import { useState, useCallback } from "react";
import { AiOutlineUser } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";

const Header = ({ onLogoutClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const title = "Hansaria Food Private Limited";
  const profile = "Profile";
  const logout = "Logout";
  
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <div className="relative">
        <button
          className="flex items-center space-x-2 font-medium text-gray-700 hover:text-gray-900"
          onClick={toggleDropdown}
        >
          <div className="w-10 h-10 rounded-full bg-gray-300 grid place-items-center">
            <AiOutlineUser size={24} />
          </div>
          <span>{profile}</span>
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg">
            <button
              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-100 flex items-center space-x-2"
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
