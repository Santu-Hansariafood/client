import PropTypes from "prop-types";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";

const DashboardLayout = ({ children }) => {
  const { userRole } = useAuth();

  const bgTheme = useMemo(() => {
    const isAdmin = userRole === "Admin" || userRole === "SuperAdmin" || userRole === "Owner";
    const isEmployee = userRole === "Employee";

    if (isAdmin) {
      return {
        base: "bg-[#f0fdf4]",
        radialBg: "bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f0fdfa_40%,_#f8fafc_100%)]",
        blob1: "bg-emerald-400/10",
        blob2: "bg-teal-400/8",
        blob3: "bg-blue-400/6",
      };
    }
    if (isEmployee) {
      return {
        base: "bg-[#eef2ff]",
        radialBg: "bg-[radial-gradient(ellipse_at_top,_#eef2ff_0%,_#e0e7ff_40%,_#f8fafc_100%)]",
        blob1: "bg-indigo-400/10",
        blob2: "bg-blue-400/8",
        blob3: "bg-violet-400/6",
      };
    }
    return {
      base: "bg-[#eff6ff]",
      radialBg: "bg-[radial-gradient(ellipse_at_top,_#eff6ff_0%,_#dbeafe_40%,_#f8fafc_100%)]",
      blob1: "bg-blue-400/10",
      blob2: "bg-indigo-400/8",
      blob3: "bg-sky-400/6",
    };
  }, [userRole]);

  return (
    <div className={`min-h-screen ${bgTheme.base} relative overflow-x-hidden`}>
      <div className={`fixed inset-0 -z-10 ${bgTheme.radialBg}`} />
      <div className="fixed inset-0 -z-10">
        <div className={`absolute top-[-8%] left-[-5%] w-[45%] h-[45%] ${bgTheme.blob1} blur-[140px] rounded-full animate-pulseSlow pointer-events-none`} />
        <div className={`absolute bottom-[-12%] right-[-8%] w-[50%] h-[50%] ${bgTheme.blob2} blur-[160px] rounded-full animate-pulseSlow pointer-events-none [animation-delay:1200ms]`} />
        <div className={`absolute top-[40%] left-[30%] w-[35%] h-[35%] ${bgTheme.blob3} blur-[120px] rounded-full animate-pulseSlow pointer-events-none [animation-delay:2400ms]`} />
      </div>
      <div className="fixed inset-0 -z-10 opacity-[0.025] pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-0">{children}</div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
