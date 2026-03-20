import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaTruck, FaCar, FaWarehouse, FaCheckCircle } from 'react-icons/fa';

const UserProfileCard = ({ user }) => {
  if (!user) return null;

  const roleSpecificDetails = () => {
    switch (user.role) {
      case 'Transporter':
        return (
          <>
            <DetailItem icon={<FaTruck />} label="Vehicle Number" value={user.vehicleDetails?.number} />
            <DetailItem icon={<FaCar />} label="Vehicle Type" value={user.vehicleDetails?.type} />
          </>
        );
      case 'Buyer':
        return <DetailItem icon={<FaWarehouse />} label="Primary Company" value={user.company?.label || 'N/A'} />;
      case 'Seller':
        return <DetailItem icon={<FaCheckCircle />} label="Status" value={user.status} />;
      default:
        return null;
    }
  };

  const getEmail = () => {
    if (user.email) return user.email;
    if (user.emails && user.emails.length > 0) {
      // Handle both array of objects [{value: "..."}] and array of strings
      const firstEmail = user.emails[0];
      return typeof firstEmail === 'object' ? firstEmail.value : firstEmail;
    }
    return 'N/A';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <FaUser className="text-white text-3xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-sm text-emerald-100">{user.role}</p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailItem icon={<FaEnvelope />} label="Email Address" value={getEmail()} />
        <DetailItem icon={<FaPhone />} label="Mobile Number" value={user.mobile} />
        {roleSpecificDetails()}
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="text-emerald-500 mt-1">{icon}</div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-base font-medium text-slate-700">{value || 'N/A'}</p>
    </div>
  </div>
);

export default UserProfileCard;
