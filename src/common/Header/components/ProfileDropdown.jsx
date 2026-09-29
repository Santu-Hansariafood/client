import { AiOutlineUser, AiOutlineLock } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import PWAInstall from "../../PWAInstall/PWAInstall";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const ProfileDropdown = ({
  dropdownRef,
  isProfileDropdownOpen,
  setProfileDropdownOpen,
  setShowNotifications,
  onLogoutClick,
  setChangePasswordOpen,
}) => {
  const { userRole, mobile, user } = useAuth();

  const toggleDropdown = () => {
    setProfileDropdownOpen((prev) => !prev);
    setShowNotifications(false);
  };

  const isAuthenticated = !!user || !!mobile;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus:outline-none transition-all duration-200"
      >
        <div className="relative w-10 h-10">
          {isAuthenticated && (
            <span className="absolute inset-0 rounded-full border-2 border-green-300/60 animate-pulseSlow pointer-events-none" />
          )}
          <div className="relative w-full h-full rounded-full bg-emerald-700 border-2 border-green-300 flex items-center justify-center shadow-md overflow-hidden">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <AiOutlineUser size={20} className="text-white" />
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-start transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]">
          <span className="text-xs text-emerald-100 font-bold">{userRole}</span>
          <span className="text-[11px] text-white font-medium max-w-[120px] truncate">
            {mobile}
          </span>
        </div>
      </button>

      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-3 w-60 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-down animate-pop-in">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <p className="text-xs uppercase text-slate-400 font-bold">
              Logged In As
            </p>
            <h4 className="font-black text-slate-700 mt-1 truncate">
              {mobile}
            </h4>
            <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 cursor-default">
              {userRole}
            </span>
          </div>

          <button
            className="relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-slate-50 transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 focus:outline-none group overflow-hidden"
            onClick={() => {
              setProfileDropdownOpen(false);
              setChangePasswordOpen(true);
            }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
            <AiOutlineLock size={18} className="transition-transform duration-300 group-hover:scale-110 shrink-0" />
            Change Password
          </button>

          <button
            className="relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all border-t border-slate-100 min-h-[48px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400 focus:outline-none group overflow-hidden"
            onClick={() => {
              setProfileDropdownOpen(false);
              onLogoutClick?.();
            }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
            <RiLogoutBoxLine size={18} className="transition-transform duration-300 group-hover:scale-110 shrink-0" />
            Logout
          </button>

          <div className="md:hidden border-t border-slate-100 p-3">
            <PWAInstall />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
