import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiLogoutBoxLine } from "react-icons/ri";
import { AiOutlineUser } from "react-icons/ai";

const Dashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-gray-800">
          Hansaria Food Private Limited
        </h1>
        <div className="relative">
          <button
            className="flex items-center space-x-2 font-medium text-gray-700 hover:text-gray-900"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-10 h-10 rounded-full bg-gray-300 grid place-items-center">
              <AiOutlineUser size={24} />
            </div>
            <span>Profile</span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg">
              <button
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={handleLogout}
              >
                <RiLogoutBoxLine size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="px-6 py-8">
        <p className="text-lg font-medium text-gray-700">
          Welcome to Hansaria Food Private Limited
        </p>
      </main>
    </div>
  );
};

export default Dashboard;
