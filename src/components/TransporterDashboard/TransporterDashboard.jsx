import { useState, useEffect } from "react";
import {
  FaTruck,
  FaClock,
  FaCalendarCheck,
  FaCreditCard,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import DashboardBlogSection from "../../pages/Blog/components/DashboardBlogSection";

const TransporterDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-lux-ink">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lux-muted">Here is your Transporter Dashboard.</p>
        </div>
        <div className="flex items-center gap-2 bg-lux-ivory text-lux-gold px-4 py-2 rounded-lg border border-[#e9e2d3]">
          <FaClock />
          <span className="font-medium">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FaTruck className="text-lux-emerald" />}
          label="Total Trips"
          value="48"
          color="bg-lux-ivory"
        />
        <StatCard
          icon={<FaCalendarCheck className="text-lux-emerald" />}
          label="Pending Deliveries"
          value="5"
          color="bg-[#f2eee2]"
        />
        <StatCard
          icon={<FaCreditCard className="text-lux-gold" />}
          label="Pending Payments"
          value="₹12,500"
          color="bg-lux-ivory"
        />
        <StatCard
          icon={<FaUser className="text-lux-emerald" />}
          label="Status"
          value={user?.status || "Active"}
          color="bg-[#f2eee2]"
        />
      </div>

      <UserProfileCard user={user} />
      
      <DashboardBlogSection />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="lux-card lux-card-hover p-6 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-lux-muted">{label}</p>
      <p className="text-xl font-bold text-lux-ink">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-lux-muted uppercase tracking-wider">
      {label}
    </p>
    <p className="text-base font-medium text-lux-ink">
      {value || "Not Provided"}
    </p>
  </div>
);

export default TransporterDashboard;
