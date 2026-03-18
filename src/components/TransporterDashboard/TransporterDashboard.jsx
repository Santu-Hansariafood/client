import { useState, useEffect } from "react";
import { FaTruck, FaClock, FaCalendarCheck, FaCreditCard, FaUser } from "react-icons/fa";

const TransporterDashboard = () => {
  const [transporterInfo, setTransporterInfo] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setTransporterInfo(user);
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transporter Portal: {transporterInfo?.name}</h1>
          <p className="text-slate-500">Manage your vehicles and view logistics details.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100">
          <FaClock />
          <span className="font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      {/* Stats Grid */}
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
          value="Verified" 
          color="bg-orange-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicle & Driver Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Vehicle & Driver Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailItem label="Vehicle Number" value={transporterInfo?.vehicleDetails?.number} />
            <DetailItem label="Vehicle Type" value={transporterInfo?.vehicleDetails?.type} />
            <DetailItem label="Owner Name" value={transporterInfo?.vehicleDetails?.ownerName} />
            <DetailItem label="Driver Name" value={transporterInfo?.driverDetails?.name} />
            <DetailItem label="License Number" value={transporterInfo?.driverDetails?.licenseNumber} />
            <DetailItem label="Driver Contact" value={transporterInfo?.driverDetails?.phoneNumber} />
          </div>
        </div>

        {/* Bank & Payment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Bank & Payment Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailItem label="Account Holder" value={transporterInfo?.bankDetails?.accountHolderName} />
            <DetailItem label="Account Number" value={transporterInfo?.bankDetails?.accountNumber} />
            <DetailItem label="IFSC Code" value={transporterInfo?.bankDetails?.ifscCode} />
            <DetailItem label="Bank Name" value={transporterInfo?.bankDetails?.bankName} />
            <DetailItem label="Branch" value={transporterInfo?.bankDetails?.branchName} />
          </div>
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
