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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-white/10 transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-amber-300 flex items-center justify-center shadow-md overflow-hidden">
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

        <div className="hidden md:flex flex-col items-start">
          <span className="text-xs text-emerald-100 font-bold">{userRole}</span>
          <span className="text-[11px] text-white font-medium max-w-[120px] truncate">
            {mobile}
          </span>
        </div>
      </button>

      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-3 w-60 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <p className="text-xs uppercase text-slate-400 font-bold">
              Logged In As
            </p>
            <h4 className="font-black text-slate-700 mt-1 truncate">
              {mobile}
            </h4>
            <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              {userRole}
            </span>
          </div>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-slate-50 transition"
            onClick={() => {
              setProfileDropdownOpen(false);
              setChangePasswordOpen(true);
            }}
          >
            <AiOutlineLock size={18} />
            Change Password
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition border-t border-slate-100"
            onClick={() => {
              setProfileDropdownOpen(false);
              onLogoutClick?.();
            }}
          >
            <RiLogoutBoxLine size={18} />
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
