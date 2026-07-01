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
  FaPlus,
  FaCheckCircle,
  FaEdit,
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
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [showAddWorkModal, setShowAddWorkModal] = useState(false);
  const [newWork, setNewWork] = useState({
    workType: "Custom Task",
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    const convertLogo = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Logo conversion failed", e);
      }
    };
    convertLogo();
  }, []);

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

  const fetchWorks = async () => {
    if (!user?._id) return;
    setWorksLoading(true);
    try {
      const res = await api.get(`/employee-works/employee/${user._id}`);
      setWorks(res.data.data || []);
    } catch (error) {
      console.error("Error fetching works:", error);
      toast.error("Failed to fetch work status");
    } finally {
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, [user?._id]);

  const handleAddWork = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    try {
      await api.post("/employee-works", {
        ...newWork,
        employeeId: user._id,
      });
      toast.success("Work added successfully!");
      setShowAddWorkModal(false);
      setNewWork({
        workType: "Custom Task",
        title: "",
        description: "",
        status: "Pending",
        priority: "Medium",
        dueDate: "",
        notes: "",
      });
      fetchWorks();
    } catch (error) {
      console.error("Error adding work:", error);
      toast.error("Failed to add work");
    }
  };

  const handleUpdateWorkStatus = async (workId, newStatus) => {
    try {
      await api.put(`/employee-works/${workId}`, { status: newStatus });
      toast.success("Status updated successfully!");
      fetchWorks();
    } catch (error) {
      console.error("Error updating work status:", error);
      toast.error("Failed to update status");
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Assigned":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-purple-100 text-purple-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "bg-gray-100 text-gray-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-8 space-y-10 overflow-hidden bg-slate-50/50">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full -ml-40 -mb-40 animate-pulse delay-700"></div>
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
            {getGreeting()},{" "}
            <span className="text-indigo-600">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Ready to manage your operations? Here&apos;s your daily productivity
            snapshot.
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
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
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
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintIDCard}
                disabled={isPrinting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPrinting ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaIdCard />
                )}
                {isPrinting ? "Generating..." : "Print ID Card"}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                <FaUserEdit />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8 w-full">
            <DetailItem
              icon={<FaUserTie className="text-indigo-500" />}
              label="Full Name"
              value={user?.name}
            />
            <DetailItem
              icon={<FaShieldAlt className="text-blue-500" />}
              label="Employee ID"
              value={user?.employeeId}
            />
            <DetailItem
              icon={<FaEnvelope className="text-emerald-500" />}
              label="Email Address"
              value={user?.email}
            />
            <DetailItem
              icon={<FaPhone className="text-amber-500" />}
              label="Mobile Number"
              value={user?.mobile}
            />
            <DetailItem
              icon={<FaVenusMars className="text-rose-500" />}
              label="Gender"
              value={user?.sex}
            />
            <DetailItem
              icon={<FaShieldAlt className="text-violet-500" />}
              label="Current Role"
              value={user?.role || "Employee"}
            />
          </div>
        </div>
      </div>
      <div className="relative z-10 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-slate-100/60 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <FaClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Work Status
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Track your assigned and ongoing work
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddWorkModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <FaPlus />
            Add Work
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {worksLoading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">
                No work items yet. Add your first task!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {works.map((work) => (
                <div
                  key={work._id}
                  className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {work.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(work.status)}`}
                        >
                          {work.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(work.priority)}`}
                        >
                          {work.priority}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {work.workType}
                        </span>
                      </div>
                      {work.description && (
                        <p className="text-slate-600 text-sm mb-3">
                          {work.description}
                        </p>
                      )}
                      {work.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <FaCalendarCheck />
                          <span>
                            Due: {new Date(work.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {work.status !== "Completed" &&
                        work.status !== "Cancelled" && (
                          <select
                            value={work.status}
                            onChange={(e) =>
                              handleUpdateWorkStatus(work._id, e.target.value)
                            }
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showAddWorkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                Add New Work
              </h2>
            </div>
            <form onSubmit={handleAddWork} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Work Type
                </label>
                <select
                  value={newWork.workType}
                  onChange={(e) =>
                    setNewWork({ ...newWork, workType: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Loading Entry">Loading Entry</option>
                  <option value="Sauda Management">Sauda Management</option>
                  <option value="Bid Participation">Bid Participation</option>
                  <option value="Custom Task">Custom Task</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newWork.title}
                  onChange={(e) =>
                    setNewWork({ ...newWork, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newWork.description}
                  onChange={(e) =>
                    setNewWork({ ...newWork, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newWork.priority}
                    onChange={(e) =>
                      setNewWork({ ...newWork, priority: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newWork.dueDate}
                    onChange={(e) =>
                      setNewWork({ ...newWork, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddWorkModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Add Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DashboardBlogSection />
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, gradient, glowColor }) => (
  <div
    className={`relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] group hover:shadow-2xl transition-all duration-500 overflow-hidden ${glowColor}`}
  >
    <div
      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.08] transition-opacity duration-500`}
    ></div>

    <div className="relative z-10 flex items-start justify-between mb-6">
      <div
        className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xl shadow-current/20 group-hover:scale-110 transition-transform duration-500`}
      >
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
