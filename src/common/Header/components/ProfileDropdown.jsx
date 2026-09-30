import { AiOutlineUser, AiOutlineLock } from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import { FaCrown, FaUserTie, FaShieldAlt } from "react-icons/fa";
import PWAInstall from "../../PWAInstall/PWAInstall";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useMemo } from "react";

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

  const isAdmin = useMemo(
    () => userRole === "Admin" || userRole === "SuperAdmin" || userRole === "Owner",
    [userRole],
  );
  const isEmployee = useMemo(() => userRole === "Employee", [userRole]);

  const avatarGradient = useMemo(() => {
    if (isAdmin) return "from-emerald-500 via-teal-500 to-cyan-600";
    if (isEmployee) return "from-indigo-500 via-blue-500 to-violet-600";
    return "from-emerald-500 via-teal-500 to-cyan-600";
  }, [isAdmin, isEmployee]);

  const avatarBorder = useMemo(() => {
    if (isAdmin) return "border-emerald-300/70";
    if (isEmployee) return "border-indigo-300/70";
    return "border-emerald-300/70";
  }, [isAdmin, isEmployee]);

  const roleBadgeClass = useMemo(() => {
    if (isAdmin) return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200";
    if (isEmployee) return "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200";
    return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200";
  }, [isAdmin, isEmployee]);

  const roleIcon = useMemo(() => {
    if (isAdmin) return <FaCrown size={10} className="mr-1" />;
    if (isEmployee) return <FaUserTie size={10} className="mr-1" />;
    return <FaShieldAlt size={10} className="mr-1" />;
  }, [isAdmin, isEmployee]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="group flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-2xl hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus:outline-none transition-all duration-300 bg-white/5 border border-white/5 hover:border-white/15"
      >
        <div className="relative w-10 h-10">
          {isAuthenticated && (
            <span className={`absolute inset-0 rounded-full border-2 ${avatarBorder} animate-pulseSlow pointer-events-none`} />
          )}
          <div
            className={`relative w-full h-full rounded-full bg-gradient-to-br ${avatarGradient} border-2 ${avatarBorder} flex items-center justify-center shadow-xl overflow-hidden group-hover:scale-105 group-hover:rotate-3 transition-all duration-400`}
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <AiOutlineUser size={20} className="text-white drop-shadow-md" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10 pointer-events-none" />
          </div>
        </div>

        <div className="hidden md:flex flex-col items-start transition-all duration-300 group-hover:-translate-y-0.5">
          <span className={`text-xs font-black ${isAdmin ? "text-emerald-200" : isEmployee ? "text-indigo-200" : "text-emerald-200"} inline-flex items-center gap-1`}>
            {roleIcon}
            {userRole}
          </span>
          <span className="text-[11px] text-white/90 font-medium max-w-[120px] truncate leading-tight">
            {user?.name || mobile}
          </span>
        </div>
      </button>

      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-down animate-pop-in">
          <div className="p-5 bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-100 relative overflow-hidden">
            <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full bg-gradient-to-br ${avatarGradient} opacity-5 blur-2xl`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className="relative shrink-0">
                <span className={`absolute inset-0 rounded-full border-2 ${avatarBorder} animate-pulseSlow pointer-events-none`} />
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient} border-2 ${avatarBorder} flex items-center justify-center shadow-xl overflow-hidden animate-float`}
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <AiOutlineUser size={30} className="text-white drop-shadow-md" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">
                  Logged In As
                </p>
                <h4 className="font-black text-slate-800 mt-0 truncate text-lg leading-tight">
                  {user?.name || mobile}
                </h4>
                <span className={`inline-flex mt-2 items-center px-3 py-1 rounded-full border ${roleBadgeClass} text-[10px] font-black transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 cursor-default shadow-sm`}>
                  {roleIcon}
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-2">
            <button
              className="relative w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all min-h-[52px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 focus:outline-none group rounded-xl overflow-hidden border border-transparent hover:border-slate-100 my-1"
              onClick={() => {
                setProfileDropdownOpen(false);
                setChangePasswordOpen(true);
              }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-500 to-teal-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 rounded-r-full" />
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                <AiOutlineLock size={18} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-slate-800">Change Password</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure your account</p>
              </div>
            </button>

            <button
              className="relative w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50/60 transition-all border-t border-slate-100 min-h-[52px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400 focus:outline-none group rounded-xl overflow-hidden border border-transparent hover:border-red-100 mt-1"
              onClick={() => {
                setProfileDropdownOpen(false);
                onLogoutClick?.();
              }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-red-500 to-rose-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 rounded-r-full" />
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 text-red-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                <RiLogoutBoxLine size={18} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-red-700">Logout</p>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Sign out of session</p>
              </div>
            </button>
          </div>

          <div className="md:hidden border-t border-slate-100 p-4 bg-slate-50/50">
            <PWAInstall />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
