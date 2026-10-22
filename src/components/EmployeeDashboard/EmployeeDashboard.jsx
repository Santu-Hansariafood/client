import { useState, useEffect, useMemo, memo } from "react";
import api from "../../utils/apiClient/apiClient";
import {
  FaUserTie,
  FaClock,
  FaCalendarCheck,
  FaUserEdit,
  FaEnvelope,
  FaPhone,
  FaVenusMars,
  FaShieldAlt,
  FaBolt,
  FaIdCard,
  FaSpinner,
  FaClipboardList,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import EmployeeIDCardPDF from "./EmployeeIDCardPDF";
import logo from "../../assets/Hans.png";
import { toast } from "react-toastify";
import DashboardBlogSection from "../../pages/Blog/components/DashboardBlogSection";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);
  const [stats, setStats] = useState({
    totalSaudas: 0,
    activeBids: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Memoize greeting to prevent unnecessary recalculations
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Memoize current date
  const currentDate = useMemo(() => new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }), []);

  useEffect(() => {
    const convertLogo = async () => {
      try {
        const response = await fetch(logo);
        if (!response.ok) throw new Error("Failed to load logo");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Logo conversion failed", e);
        // Fallback - don't break the UI if logo fails
      }
    };
    convertLogo();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const [bidsRes, saudasRes] = await Promise.all([
          api.get("/bids"),
          api.get("/self-order"),
        ]);

        const bids = bidsRes.data?.data || bidsRes.data || [];
        const saudas = saudasRes.data?.data || saudasRes.data || [];

        const now = new Date();
        const activeBids = bids.filter((bid) => {
          try {
            const bidDateStr = bid.bidDate
              ? bid.bidDate.split("T")[0]
              : new Date().toISOString().split("T")[0];
            const [year, month, day] = bidDateStr.split("-").map(Number);
            const [endHours, endMinutes] = bid.endTime?.split(":")?.map(Number) || [0, 0];
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
          } catch (err) {
            console.warn("Skipping invalid bid", bid, err);
            return false;
          }
        });

        setStats({
          totalSaudas: saudas.length,
          activeBids: activeBids.length,
        });
      } catch (error) {
        console.error("Error fetching employee stats", error);
        setStatsError(error.response?.data?.message || "Failed to load statistics");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handlePrintIDCard = async () => {
    if (!user) {
      toast.error("User data not found!");
      return;
    }

    setIsPrinting(true);
    const toastId = toast.loading("Generating ID Card...");
    try {
      const qrData = JSON.stringify({
        id: user.employeeId,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role || "Employee",
        status: "Verified",
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 200,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const doc = (
        <EmployeeIDCardPDF
          user={user}
          qrCodeData={qrCodeUrl}
          logoUrl={logoBase64}
        />
      );

      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ID_Card_${user.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: "ID Card generated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating ID Card:", error);
      toast.update(toastId, {
        render: `Failed to generate ID Card: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsPrinting(false);
    }
  };



  return (
    <div className="relative min-h-screen px-4 sm:px-8 py-4 sm:py-8 space-y-10 overflow-hidden bg-transparent" role="main" aria-label="Employee Dashboard">
      <div className="absolute top-0 right-0 w-96 h-96 bg-lux-gold/10 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-lux-emerald/5 blur-[100px] rounded-full -ml-40 -mb-40 animate-pulse delay-700"></div>
      <header className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 rounded-xl shadow-sm" aria-hidden="true">
              <FaBolt className="animate-pulse" />
            </div>
            <span className="text-[10px] font-display font-black text-lux-gold uppercase tracking-[0.2em]">
              Welcome Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-lux-ink tracking-tight">
            {greeting},{" "}
            <span className="text-lux-emerald">{user?.name || "Guest"}</span>!
          </h1>
          <p className="text-lux-muted font-medium max-w-lg">
            Ready to manage your operations? Here&apos;s your daily productivity
            snapshot.
          </p>
        </div>

        <div className="flex items-center gap-4 lux-card bg-lux-cream/80 backdrop-blur-xl border border-[#e9e2d3] shadow-xl shadow-lux-emerald/10 p-1.5 rounded-[1.5rem]">
          <div className="flex items-center gap-3 px-5 py-3 rounded-[1.25rem] bg-gradient-to-br from-lux-night via-lux-deep to-lux-night text-lux-gold-soft ring-1 ring-lux-gold/20 shadow-lg">
            <FaClock className="text-lux-gold" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lux-gold/70 leading-none mb-1">
                System Date
              </span>
              <time className="text-sm font-black tracking-tight" dateTime={new Date().toISOString()}>
                {currentDate}
              </time>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative z-10">
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="lux-card rounded-[2.5rem] p-8 border-[#e9e2d3] animate-pulse">
                <div className="w-16 h-16 bg-[#ece4d2] rounded-2xl mb-6"></div>
                <div className="w-24 h-4 bg-[#ece4d2] rounded mb-3"></div>
                <div className="w-16 h-10 bg-[#ece4d2] rounded mb-4"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ece4d2] rounded-full"></div>
                  <div className="w-28 h-3 bg-[#ece4d2] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : statsError ? (
          <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 text-center">
            <p className="text-red-700 font-medium mb-4">{statsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            <StatCard
              icon={<FaClipboardList size={24} aria-hidden="true" />}
              label="Total Saudas"
              value={stats.totalSaudas}
              trend="+12% this week"
              gradient="from-lux-emerald to-lux-deep"
              glowColor="shadow-lux-emerald/20"
            />
            <StatCard
              icon={<FaCalendarCheck size={24} aria-hidden="true" />}
              label="Active Bids"
              value={stats.activeBids}
              trend="Live interactions"
              gradient="from-lux-emerald to-lux-deep"
              glowColor="shadow-lux-emerald/20"
            />
            <StatCard
              icon={<FaUserTie size={24} aria-hidden="true" />}
              label="System Status"
              value={user?.status || "Active"}
              trend="Role: Employee"
              gradient="from-lux-emerald to-lux-deep"
              glowColor="shadow-lux-emerald/20"
            />
          </div>
        )}
      </section>
      <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
        <div className="lux-card bg-lux-cream/80 backdrop-blur-2xl rounded-[2.5rem] border border-[#e9e2d3] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group hover:shadow-[0_20px_50px_rgba(6,95,70,0.12)] transition-all duration-700">
          <div className="p-8 sm:p-10 border-b border-[#e9e2d3]/60 flex items-center justify-between bg-gradient-to-r from-lux-ivory to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-lux-emerald to-lux-deep rounded-2xl flex items-center justify-center text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <FaUserTie size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black font-serif text-lux-ink tracking-tight">
                  Employee Identity Profile
                </h2>
                <p className="text-xs font-black font-display text-lux-muted uppercase tracking-widest">
                  Personal Information & Access Details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintIDCard}
                disabled={isPrinting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 rounded-xl text-xs font-black font-display uppercase tracking-widest hover:from-lux-deep hover:to-lux-night transition-all shadow-lg shadow-lux-emerald/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPrinting ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaIdCard />
                )}
                {isPrinting ? "Generating..." : "Print ID Card"}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-lux-ink text-lux-gold-soft hover:bg-lux-night ring-1 ring-lux-gold/20 rounded-xl text-xs font-black font-display uppercase tracking-widest transition-all shadow-lg shadow-lux-emerald/10">
                <FaUserEdit />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8 w-full">
            <DetailItem
              icon={<FaUserTie className="text-lux-emerald" />}
              label="Full Name"
              value={user?.name}
            />
            <DetailItem
              icon={<FaShieldAlt className="text-lux-emerald" />}
              label="Employee ID"
              value={user?.employeeId}
            />
            <DetailItem
              icon={<FaEnvelope className="text-lux-emerald" />}
              label="Email Address"
              value={user?.email}
            />
            <DetailItem
              icon={<FaPhone className="text-lux-emerald" />}
              label="Mobile Number"
              value={user?.mobile}
            />
            <DetailItem
              icon={<FaVenusMars className="text-lux-gold" />}
              label="Gender"
              value={user?.sex}
            />
            <DetailItem
              icon={<FaShieldAlt className="text-lux-gold" />}
              label="Current Role"
              value={user?.role || "Employee"}
            />
          </div>
        </div>
      </div>

      <DashboardBlogSection />
    </div>
  );
};

// Memoized StatCard to prevent unnecessary re-renders
const StatCard = memo(({ icon, label, value, trend, gradient, glowColor }) => {
  return (
    <div
      className={`relative lux-card bg-lux-cream rounded-[2.5rem] p-8 border-[#e9e2d3] shadow-[0_8px_30px_rgb(0,0,0,0.02)] group hover:shadow-2xl transition-all duration-500 overflow-hidden ${glowColor}`}
      role="article"
      aria-label={`${label}: ${value}`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.08] transition-opacity duration-500`}
        aria-hidden="true"
      ></div>

      <div className="relative z-10 flex items-start justify-between mb-6">
        <div
          className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-lux-gold-soft shadow-xl shadow-lux-emerald/20 group-hover:scale-110 transition-transform duration-500`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-lux-muted uppercase tracking-widest leading-none">
            {label}
          </span>
          <h4 className="text-4xl font-black text-lux-ink tracking-tighter mt-1">
            {value}
          </h4>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 mt-4">
        <div className="w-1.5 h-1.5 rounded-full bg-lux-gold animate-pulse" aria-hidden="true"></div>
        <span className="text-[10px] font-bold text-lux-muted uppercase tracking-[0.15em]">
          {trend}
        </span>
      </div>
    </div>
  );
});

// Memoized DetailItem to prevent unnecessary re-renders
const DetailItem = memo(({ icon, label, value }) => {
  return (
    <div className="group/item flex items-center gap-5 w-full min-w-0" role="listitem">
      <div className="w-12 h-12 rounded-2xl bg-lux-ivory flex items-center justify-center group-hover/item:bg-lux-cream group-hover/item:shadow-lg transition-all duration-300 border border-[#e9e2d3]" aria-hidden="true">
        <span className="group-hover/item:scale-110 transition-transform duration-300">
          {icon}
        </span>
      </div>
      <div className="space-y-0.5 flex-1 min-w-0">
        <p className="text-[10px] font-black text-lux-muted uppercase tracking-[0.2em] leading-tight">
          {label}
        </p>
        <p className="text-base font-black text-lux-ink tracking-tight group-hover/item:text-lux-emerald transition-colors break-words">
          {value || "Not Provided"}
        </p>
      </div>
    </div>
  );
});

export default EmployeeDashboard;
