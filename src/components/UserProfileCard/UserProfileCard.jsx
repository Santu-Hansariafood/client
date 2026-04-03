import {
  FaEnvelope,
  FaPhone,
  FaTruck,
  FaCar,
  FaWarehouse,
  FaCheckCircle,
} from "react-icons/fa";
import { toTitleCase } from "../../utils/textUtils/textUtils";

const UserProfileCard = ({ user }) => {
  if (!user) return null;

  const roleSpecificDetails = () => {
    switch (user.role) {
      case "Transporter":
        return (
          <>
            <DetailItem
              icon={<FaTruck />}
              label="Vehicle Number"
              value={user.vehicleDetails?.number}
            />
            <DetailItem
              icon={<FaCar />}
              label="Vehicle Type"
              value={user.vehicleDetails?.type}
            />
          </>
        );
      case "Buyer":
        return (
          <DetailItem
            icon={<FaWarehouse />}
            label="Primary Company"
            value={user.company?.label || "Not Added"}
          />
        );
      case "Seller":
        return (
          <DetailItem
            icon={<FaCheckCircle />}
            label="Status"
            value={user.status}
          />
        );
      default:
        return null;
    }
  };

  const getEmail = () => {
    if (user.email) return user.email;
    if (user.emails && user.emails.length > 0) {
      const firstEmail = user.emails[0];
      return typeof firstEmail === "object" ? firstEmail.value : firstEmail;
    }
    return "N/A";
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl bg-white/70 backdrop-blur-xl border border-white/40">
      <div className="relative bg-gradient-to-r from-emerald-500 to-green-700 p-6 sm:p-8 flex items-center gap-4">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

        <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
          {user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {toTitleCase(user.name)}
            </h2>

            <span className="relative flex items-center justify-center">
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px]">
                ✓
              </span>
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50 animate-pulse"></span>
            </span>
          </div>

          {user.role === "Buyer" && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-white/80 uppercase tracking-wider">
                Trustable Buyer
              </span>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                <img
                  src="/icons/favicon-16x16.png"
                  alt="Hansaria Food"
                  className="w-4 h-4 rounded-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailItem
          icon={<FaEnvelope />}
          label="Email Address"
          value={getEmail()}
        />
        <DetailItem
          icon={<FaPhone />}
          label="Mobile Number"
          value={user.mobile}
        />

        {roleSpecificDetails()}
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div
    className="flex items-start gap-3 p-3 rounded-xl 
    bg-white shadow-sm border border-slate-200 
    hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
  >
    <div className="text-emerald-500 mt-1 text-lg">{icon}</div>
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-700 break-all">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

export default UserProfileCard;
