import { useState, useEffect } from "react";
import axios from "axios";
import { FaUserTie, FaClock, FaCalendarCheck, FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingBids: 0,
    activeOrders: 0
  });

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500">Here's what's happening in your account today.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100">
          <FaClock />
          <span className="font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<FaClipboardList className="text-blue-600" />} 
          label="Total Saudas" 
          value="24" 
          color="bg-blue-50" 
        />
        <StatCard 
          icon={<FaCalendarCheck className="text-emerald-600" />} 
          label="Active Bids" 
          value="12" 
          color="bg-emerald-50" 
        />
        <StatCard 
          icon={<FaUserTie className="text-indigo-600" />} 
          label="Profile Status" 
          value={user?.status || "Active"} 
          color="bg-indigo-50" 
        />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">My Profile Details</h2>
          <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Edit Profile</button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <DetailItem label="Full Name" value={user?.name} />
          <DetailItem label="Employee ID" value={user?.employeeId} />
          <DetailItem label="Email Address" value={user?.email} />
          <DetailItem label="Mobile Number" value={user?.mobile} />
          <DetailItem label="Gender" value={user?.sex} />
          <DetailItem label="Current Role" value={user?.role || "Employee"} />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-base font-medium text-slate-700">{value || "N/A"}</p>
  </div>
);

export default EmployeeDashboard;
