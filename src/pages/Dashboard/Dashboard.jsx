import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { FaTachometerAlt, FaClipboardList, FaCalendarCheck } from "react-icons/fa";
import DashboardBlogSection from "../Blog/components/DashboardBlogSection";
import DateRangeSelector from "../../common/DateSelector/DateRangeSelector";
import Pagination from "../../common/Paginations/Paginations";
import DataDropdown from "../../common/DataDropdown/DataDropdown";
const CardGrid = lazy(() => import("./CardGrid/CardGrid"));
const ChartSection = lazy(() => import("./ChartSection/ChartSection"));

const Dashboard = () => {
  const [counts, setCounts] = useState({
    buyers: 0,
    sellers: 0,
    consignees: 0,
    orders: 0,
    bids: 0,
  });
  const [agentSaudas, setAgentSaudas] = useState([]);
  const [dateWiseWorks, setDateWiseWorks] = useState([]);
  const [employeeWiseWorks, setEmployeeWiseWorks] = useState([]);
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [workFilters, setWorkFilters] = useState({
    status: "",
    workType: "",
    employeeId: "",
    startDate: "",
    endDate: ""
  });
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalWorks, setTotalWorks] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/stats");
      const data = response.data;

      setAgentSaudas(data.agentSaudas || []);
      setDateWiseWorks(data.dateWiseWorks || []);
      setEmployeeWiseWorks(data.employeeWiseWorks || []);
      setCounts({
        buyers: data.buyers || 0,
        sellers: data.sellers || 0,
        consignees: data.consignees || 0,
        orders: data.orders || 0,
        bids: data.bids || 0,
        totalSaudaTons: data.totalSaudaTons || 0,
        employees: data.employees || 0,
        totalWorks: data.totalWorks || 0,
        pendingWorks: data.pendingWorks || 0,
        inProgressWorks: data.inProgressWorks || 0,
        completedWorks: data.completedWorks || 0,
        cancelledWorks: data.cancelledWorks || 0,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch dashboard metrics",
      );
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/employees?limit=1000");
      // Make sure we always get an array
      const empData = response.data;
      setEmployees(Array.isArray(empData) ? empData : Array.isArray(empData.data) ? empData.data : []);
    } catch (error) {
      toast.error("Failed to fetch employees");
      setEmployees([]);
    }
  }, []);

  const fetchWorks = useCallback(async () => {
    setWorksLoading(true);
    try {
      const params = new URLSearchParams();
      if (workFilters.status) params.append("status", workFilters.status);
      if (workFilters.workType) params.append("workType", workFilters.workType);
      if (workFilters.employeeId) params.append("employeeId", workFilters.employeeId);
      if (workFilters.startDate) params.append("startDate", workFilters.startDate);
      if (workFilters.endDate) params.append("endDate", workFilters.endDate);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());
      
      const response = await api.get(`/employee-works?${params.toString()}`);
      setWorks(response.data.data || []);
      setTotalWorks(response.data.total || 0);
    } catch (error) {
      toast.error("Failed to fetch employee works");
      console.error(error);
    } finally {
      setWorksLoading(false);
    }
  }, [workFilters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCounts();
    fetchEmployees();
  }, [fetchCounts, fetchEmployees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [workFilters]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

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
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Administrative Overview"
        subtitle="Intelligent monitoring for your distribution network"
        icon={FaTachometerAlt}
        noContentCard
      >
        <div className="relative min-h-screen overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f8fafc,_#f1f5f9)]" />
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-emerald-400/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[150px] rounded-full animate-pulse delay-700" />
            <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-amber-400/5 blur-[120px] rounded-full animate-pulse delay-1000" />
          </div>

          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 lg:space-y-16 relative z-10 min-w-0">
            <div className="animate-fade-in-up">
              <CardGrid counts={counts} />
            </div>

            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-emerald-500/10 rounded-[4rem] blur-[30px] opacity-20 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-5 sm:p-8 lg:p-12 border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] animate-fade-in-up delay-200 min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-10 lg:mb-12">
                  <div className="space-y-2 min-w-0">
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      Analytics Dashboard
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Agent Performance Metrics
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">
                      Deep-dive distribution analysis by sauda volume and
                      tonnage
                    </p>
                  </div>
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/50 border border-white/80 shadow-sm shrink-0 self-start sm:self-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                      Real-time Live Feed
                    </span>
                  </div>
                </div>

                <ChartSection 
                  agentSaudas={agentSaudas} 
                  dateWiseWorks={dateWiseWorks} 
                  employeeWiseWorks={employeeWiseWorks} 
                />
              </div>
            </div>

            {/* Work Stats Cards */}
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-[4rem] blur-[30px] opacity-20 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-5 sm:p-8 lg:p-12 border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] animate-fade-in-up delay-400 min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-10 lg:mb-12">
                  <div className="space-y-2 min-w-0">
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      Work Management
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Employee Work Status
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">
                      Track all work items and their current status
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                  <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-2xl border border-white/80 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Works</p>
                    <p className="text-3xl font-black text-slate-900">{counts.totalWorks || 0}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-2xl border border-white/80 shadow-sm">
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mb-2">Pending</p>
                    <p className="text-3xl font-black text-yellow-700">{counts.pendingWorks || 0}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-2xl border border-white/80 shadow-sm">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-2">In Progress</p>
                    <p className="text-3xl font-black text-purple-700">{counts.inProgressWorks || 0}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-2xl border border-white/80 shadow-sm">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-2">Completed</p>
                    <p className="text-3xl font-black text-green-700">{counts.completedWorks || 0}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-2xl border border-white/80 shadow-sm">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-2">Cancelled</p>
                    <p className="text-3xl font-black text-red-700">{counts.cancelledWorks || 0}</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6 items-end">
                  <div className="w-64">
                    <DataDropdown
                      options={[
                        { value: "", label: "All Employees" },
                        ...employees.map((emp) => ({
                          value: emp._id,
                          label: `${emp.name} (${emp.employeeId})`
                        }))
                      ]}
                      selectedOptions={workFilters.employeeId}
                      onChange={(selected) => {
                        const newEmployeeId = selected?.value || "";
                        setWorkFilters({ ...workFilters, employeeId: newEmployeeId });
                      }}
                      placeholder="Select Employee"
                      isClearable={true}
                    />
                  </div>
                  <div className="w-64">
                    <DataDropdown
                      options={[
                        { value: "", label: "All Statuses" },
                        { value: "Pending", label: "Pending" },
                        { value: "Assigned", label: "Assigned" },
                        { value: "In Progress", label: "In Progress" },
                        { value: "Completed", label: "Completed" },
                        { value: "Cancelled", label: "Cancelled" }
                      ]}
                      selectedOptions={workFilters.status}
                      onChange={(selected) => {
                        const newStatus = selected?.value || "";
                        setWorkFilters({ ...workFilters, status: newStatus });
                      }}
                      placeholder="Select Status"
                      isClearable={true}
                    />
                  </div>
                  <div className="w-64">
                    <DataDropdown
                      options={[
                        { value: "", label: "All Types" },
                        { value: "Loading Entry", label: "Loading Entry" },
                        { value: "Sauda Management", label: "Sauda Management" },
                        { value: "Bid Creation", label: "Bid Creation" },
                        { value: "Bid Management", label: "Bid Management" },
                        { value: "Bid Participation", label: "Bid Participation" },
                        { value: "Payment Entry", label: "Payment Entry" },
                        { value: "Payment Management", label: "Payment Management" },
                        { value: "Custom Task", label: "Custom Task" },
                        { value: "Other Entry", label: "Other Entry" }
                      ]}
                      selectedOptions={workFilters.workType}
                      onChange={(selected) => {
                        const newWorkType = selected?.value || "";
                        setWorkFilters({ ...workFilters, workType: newWorkType });
                      }}
                      placeholder="Select Work Type"
                      isClearable={true}
                    />
                  </div>
                  <DateRangeSelector
                    startDate={workFilters.startDate}
                    endDate={workFilters.endDate}
                    onStartDateChange={(date) => setWorkFilters({ ...workFilters, startDate: date })}
                    onEndDateChange={(date) => setWorkFilters({ ...workFilters, endDate: date })}
                    onClear={() => setWorkFilters({ ...workFilters, startDate: "", endDate: "" })}
                  />
                </div>

                {/* Works List */}
                {worksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : works.length === 0 ? (
                  <div className="text-center py-12 bg-white/50 rounded-2xl border border-white/60">
                    <p className="text-slate-500 font-medium">No work items found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {works.map((work) => (
                      <div key={work._id} className="bg-white/70 backdrop-blur-2xl rounded-2xl p-6 border border-white/80 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="text-lg font-bold text-slate-900">{work.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(work.status)}`}>
                                {work.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(work.priority)}`}>
                                {work.priority}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                {work.workType}
                              </span>
                            </div>
                            <div className="mb-3">
                              <p className="text-sm font-bold text-slate-600">
                                Employee: {work.employeeId?.name || "Unknown"} ({work.employeeId?.employeeId || "N/A"})
                              </p>
                              <p className="text-xs text-slate-500">
                                {work.employeeId?.email} • {work.employeeId?.mobile}
                              </p>
                            </div>
                            {work.description && (
                              <p className="text-sm text-slate-600 mb-3">{work.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <FaCalendarCheck size={12} />
                                Created: {new Date(work.createdAt).toLocaleDateString()} {new Date(work.createdAt).toLocaleTimeString()}
                              </span>
                              {work.dueDate && (
                                <span className="flex items-center gap-1">
                                  <FaCalendarCheck size={12} />
                                  Due: {new Date(work.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {work.completedAt && (
                                <span className="flex items-center gap-1 text-green-600 font-bold">
                                  <FaCalendarCheck size={12} />
                                  Completed: {new Date(work.completedAt).toLocaleDateString()} {new Date(work.completedAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination */}
                {!worksLoading && works.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalWorks}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(page) => setCurrentPage(page)}
                    onPageSizeChange={(size) => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </div>
            </div>

            <DashboardBlogSection />
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default Dashboard;
