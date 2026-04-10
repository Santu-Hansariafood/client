import { useState, useEffect } from "react";
import { FaTruck, FaClock, FaCalendarCheck, FaCreditCard, FaUser } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";

const TransporterDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500">Here is your Transporter Dashboard.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100">
          <FaClock />
          <span className="font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FaTruck className="text-blue-600" />} 
          label="Total Trips" 
          value="48" 
          color="bg-blue-50" 
        />
        <StatCard 
          icon={<FaCalendarCheck className="text-emerald-600" />} 
          label="Pending Deliveries" 
          value="5" 
          color="bg-emerald-50" 
        />
        <StatCard 
          icon={<FaCreditCard className="text-indigo-600" />} 
          label="Pending Payments" 
          value="₹12,500" 
          color="bg-indigo-50" 
        />
        <StatCard 
          icon={<FaUser className="text-orange-600" />} 
          label="Status" 
          value={user?.status || "Active"} 
          color="bg-orange-50" 
        />
      </div>

      <UserProfileCard user={user} />

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
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-base font-medium text-slate-700">{value || "Not Provided"}</p>
  </div>
);

export default TransporterDashboard;
