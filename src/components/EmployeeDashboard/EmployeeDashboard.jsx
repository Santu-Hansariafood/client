import { useState, useEffect } from "react";
import api from "../../utils/apiClient/apiClient";
import {
  FaUserTie,
  FaClock,
  FaCalendarCheck,
  FaClipboardList,
  FaUserEdit,
  FaEnvelope,
  FaPhone,
  FaVenusMars,
  FaShieldAlt,
  FaBolt,
  FaIdCard,
  FaPrint,
  FaSpinner,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import EmployeeIDCardPDF from "./EmployeeIDCardPDF";
import logo from "../../assets/Hans.png";
import { toast } from "react-toastify";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const [stats, setStats] = useState({
    totalSaudas: 0,
    activeBids: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bidsRes, saudasRes] = await Promise.all([
          api.get("/bids"),
          api.get("/sodabook"),
        ]);

        const bids = bidsRes.data?.data || bidsRes.data || [];
        const saudas = saudasRes.data?.data || saudasRes.data || [];

        const now = new Date();
        const activeBids = bids.filter((bid) => {
          const bidDateStr = bid.bidDate
            ? bid.bidDate.split("T")[0]
            : new Date().toISOString().split("T")[0];
          const [year, month, day] = bidDateStr.split("-").map(Number);
          const [endHours, endMinutes] = bid.endTime.split(":").map(Number);
          const bidEndDateTime = new Date(
            year,
            month - 1,
            day,
            endHours,
            endMinutes,
            0,
            0,
          );
          return bid.status === "active" && now < bidEndDateTime;
        });

        setStats({
          totalSaudas: saudas.length,
          activeBids: activeBids.length,
        });
      } catch (error) {
        console.error("Error fetching employee stats", error);
      }
    };
    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-8 space-y-10 overflow-hidden bg-slate-50/50">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full -ml-40 -mb-40 animate-pulse delay-700"></div>

      {/* Header Section */}
      <header className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
              <FaBolt className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
              Welcome Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-indigo-600">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Ready to manage your operations? Here&apos;s your daily productivity snapshot.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/40 p-1.5 rounded-[1.5rem]">
          <div className="flex items-center gap-3 px-5 py-3 rounded-[1.25rem] bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
            <FaClock className="text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">
                System Date
              </span>
              <span className="text-sm font-black tracking-tight">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
        <StatCard
          icon={<FaClipboardList size={24} />}
          label="Total Saudas"
          value={stats.totalSaudas}
          trend="+12% this week"
          gradient="from-blue-600 to-indigo-600"
          glowColor="shadow-blue-200/50"
        />
        <StatCard
          icon={<FaCalendarCheck size={24} />}
          label="Active Bids"
          value={stats.activeBids}
          trend="Live interactions"
          gradient="from-emerald-500 to-teal-600"
          glowColor="shadow-emerald-200/50"
        />
        <StatCard
          icon={<FaUserTie size={24} />}
          label="System Status"
          value={user?.status || "Active"}
          trend="Role: Employee"
          gradient="from-amber-500 to-orange-600"
          glowColor="shadow-amber-200/50"
        />
      </div>

      {/* Profile & Detailed Section */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] transition-all duration-700">
          <div className="p-8 sm:p-10 border-b border-slate-100/60 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <FaUserTie size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Employee Identity Profile
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Personal Information & Access Details
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
              <FaUserEdit />
              Edit Profile
            </button>
          </div>
          
          <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <DetailItem icon={<FaUserTie className="text-indigo-500" />} label="Full Name" value={user?.name} />
            <DetailItem icon={<FaShieldAlt className="text-blue-500" />} label="Employee ID" value={user?.employeeId} />
            <DetailItem icon={<FaEnvelope className="text-emerald-500" />} label="Email Address" value={user?.email} />
            <DetailItem icon={<FaPhone className="text-amber-500" />} label="Mobile Number" value={user?.mobile} />
            <DetailItem icon={<FaVenusMars className="text-rose-500" />} label="Gender" value={user?.sex} />
            <DetailItem icon={<FaShieldAlt className="text-violet-500" />} label="Current Role" value={user?.role || "Employee"} />
          </div>
        </div>

        {/* Quick Actions / Tips Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-slate-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              Quick Insights
            </div>
            <h3 className="text-2xl font-black tracking-tight leading-tight">
              Operational <br /> Excellence Tip
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Did you know? You can use the **Saria AI Agent** at the bottom right to quickly track any vehicle or find sauda details just by typing its number.
            </p>
          </div>

          <div className="relative z-10 mt-10 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <FaBolt size={14} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Power Tool</span>
            </div>
            <p className="text-slate-300 text-xs font-bold leading-relaxed italic">
              &quot;Efficiency is doing things right; effectiveness is doing the right things.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, gradient, glowColor }) => (
  <div className={`relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] group hover:shadow-2xl transition-all duration-500 overflow-hidden ${glowColor}`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.08] transition-opacity duration-500`}></div>
    
    <div className="relative z-10 flex items-start justify-between mb-6">
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xl shadow-current/20 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="text-right">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
          {label}
        </span>
        <h4 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
          {value}
        </h4>
      </div>
    </div>
    
    <div className="relative z-10 flex items-center gap-2 mt-4">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
        {trend}
      </span>
    </div>
  </div>
);

const DetailItem = ({ icon, label, value }) => (
  <div className="group/item flex items-center gap-5">
    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-lg transition-all duration-300 border border-transparent group-hover/item:border-slate-100">
      <span className="group-hover/item:scale-110 transition-transform duration-300">
        {icon}
      </span>
    </div>
    <div className="space-y-0.5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">
        {label}
      </p>
      <p className="text-base font-black text-slate-700 tracking-tight group-hover/item:text-indigo-600 transition-colors">
        {value || "Not Provided"}
      </p>
    </div>
  </div>
);

export default EmployeeDashboard;
