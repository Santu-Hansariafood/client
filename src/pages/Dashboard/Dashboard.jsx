import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaCalendarCheck,
} from "react-icons/fa";
import DashboardBlogSection from "../Blog/components/DashboardBlogSection";
import DateRangeSelector from "../../common/DateSelector/DateRangeSelector";
import Pagination from "../../common/Paginations/Paginations";
import DataDropdown from "../../common/DataDropdown/DataDropdown";
import ScrollToTop from "../../common/ScrollToTop/ScrollToTop";
const CardGrid = lazy(() => import("./CardGrid/CardGrid"));
const ChartSection = lazy(() => import("./ChartSection/ChartSection"));
const AdminAnalysisSection = lazy(() => import("./AdminAnalysisSection/AdminAnalysisSection"));

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
    endDate: "",
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
      const empData = response.data;
      setEmployees(
        Array.isArray(empData)
          ? empData
          : Array.isArray(empData.data)
            ? empData.data
            : [],
      );
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
      if (workFilters.employeeId)
        params.append("employeeId", workFilters.employeeId);
      if (workFilters.startDate)
        params.append("startDate", workFilters.startDate);
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

  const workStats = [
    { label: "Total Works", value: counts.totalWorks || 0, valueClass: "text-lux-ink", bar: "from-lux-emerald to-lux-gold" },
    { label: "Pending", value: counts.pendingWorks || 0, valueClass: "text-amber-700", bar: "from-amber-400 to-amber-600" },
    { label: "In Progress", value: counts.inProgressWorks || 0, valueClass: "text-violet-700", bar: "from-violet-400 to-violet-600" },
    { label: "Completed", value: counts.completedWorks || 0, valueClass: "text-emerald-700", bar: "from-emerald-400 to-emerald-600" },
    { label: "Cancelled", value: counts.cancelledWorks || 0, valueClass: "text-rose-700", bar: "from-rose-400 to-rose-600" },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <ScrollToTop />
      <AdminPageShell
        title="Administrative Overview"
        subtitle="Intelligent monitoring for your distribution network"
        icon={FaTachometerAlt}
        noContentCard
      >
        <div className="mx-auto max-w-7xl space-y-10 sm:space-y-12">
          <div className="animate-fade-in-up">
            <CardGrid counts={counts} />
          </div>

          <section className="lux-card lux-gold-top animate-fade-in-up p-5 [animation-delay:200ms] sm:p-8 lg:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 lg:mb-10">
              <div className="min-w-0">
                <p className="lux-eyebrow mb-1.5">Analytics Suite</p>
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-lux-ink sm:text-3xl lg:text-4xl">
                  Agent Performance Metrics
                </h2>
                <p className="mt-2 text-sm font-medium text-lux-muted sm:text-base">
                  Deep-dive distribution analysis by sauda volume and tonnage
                </p>
              </div>
              <div className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-full border border-[#e6dcc4] bg-lux-cream px-4 py-2.5 shadow-sm sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-lux-emerald animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                  Real-time Live Feed
                </span>
              </div>
            </div>

            <ChartSection
              agentSaudas={agentSaudas}
              dateWiseWorks={dateWiseWorks}
              employeeWiseWorks={employeeWiseWorks}
            />
          </section>

          <div className="animate-fade-in-up [animation-delay:300ms]">
            <AdminAnalysisSection />
          </div>

          <section className="lux-card lux-gold-top animate-fade-in-up p-5 [animation-delay:400ms] sm:p-8 lg:p-10">
            <div className="mb-6 min-w-0 sm:mb-8">
              <p className="lux-eyebrow mb-1.5">Work Management</p>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-lux-ink sm:text-3xl lg:text-4xl">
                Employee Work Status
              </h2>
              <p className="mt-2 text-sm font-medium text-lux-muted sm:text-base">
                Track all work items and their current status
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
              {workStats.map((stat) => (
                <div
                  key={stat.label}
                  className="lux-card lux-sheen overflow-hidden p-5"
                >
                  <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${stat.bar}`} />
                  <p className="lux-eyebrow mt-3">{stat.label}</p>
                  <p className={`mt-2 font-serif text-3xl font-semibold tabular-nums ${stat.valueClass}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="w-64">
                <DataDropdown
                  options={[
                    { value: "", label: "All Employees" },
                    ...employees.map((emp) => ({
                      value: emp._id,
                      label: `${emp.name} (${emp.employeeId})`,
                    })),
                  ]}
                  selectedOptions={workFilters.employeeId}
                  onChange={(selected) => {
                    const newEmployeeId = selected?.value || "";
                    setWorkFilters({
                      ...workFilters,
                      employeeId: newEmployeeId,
                    });
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
                    { value: "Cancelled", label: "Cancelled" },
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
                    {
                      value: "Sauda Management",
                      label: "Sauda Management",
                    },
                    { value: "Bid Creation", label: "Bid Creation" },
                    { value: "Bid Management", label: "Bid Management" },
                    {
                      value: "Bid Participation",
                      label: "Bid Participation",
                    },
                    { value: "Payment Entry", label: "Payment Entry" },
                    {
                      value: "Payment Management",
                      label: "Payment Management",
                    },
                    { value: "Custom Task", label: "Custom Task" },
                    { value: "Other Entry", label: "Other Entry" },
                  ]}
                  selectedOptions={workFilters.workType}
                  onChange={(selected) => {
                    const newWorkType = selected?.value || "";
                    setWorkFilters({
                      ...workFilters,
                      workType: newWorkType,
                    });
                  }}
                  placeholder="Select Work Type"
                  isClearable={true}
                />
              </div>
              <DateRangeSelector
                startDate={workFilters.startDate}
                endDate={workFilters.endDate}
                onStartDateChange={(date) =>
                  setWorkFilters({ ...workFilters, startDate: date })
                }
                onEndDateChange={(date) =>
                  setWorkFilters({ ...workFilters, endDate: date })
                }
                onClear={() =>
                  setWorkFilters({
                    ...workFilters,
                    startDate: "",
                    endDate: "",
                  })
                }
              />
            </div>

            {worksLoading ? (
              <Loading />
            ) : works.length === 0 ? (
              <div className="rounded-2xl border border-[#e9e2d3] bg-lux-cream py-12 text-center">
                <p className="font-medium text-lux-muted">
                  No work items found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {works.map((work) => (
                  <div
                    key={work._id}
                    className="lux-card lux-card-hover rounded-2xl p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="font-serif text-lg font-semibold text-lux-ink">
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
                          <span className="rounded-full border border-[#e6dcc4] bg-lux-cream px-3 py-1 text-xs font-bold text-lux-emerald">
                            {work.workType}
                          </span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-bold text-lux-ink/80">
                            Employee: {work.employeeId?.name || "Unknown"} (
                            {work.employeeId?.employeeId || "N/A"})
                          </p>
                          <p className="text-xs text-lux-muted">
                            {work.employeeId?.email} •{" "}
                            {work.employeeId?.mobile}
                          </p>
                        </div>
                        {work.description && (
                          <p className="text-sm text-lux-muted mb-3">
                            {work.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-lux-muted">
                          <span className="flex items-center gap-1">
                            <FaCalendarCheck size={12} />
                            Created:{" "}
                            {new Date(
                              work.createdAt,
                            ).toLocaleDateString()}{" "}
                            {new Date(work.createdAt).toLocaleTimeString()}
                          </span>
                          {work.dueDate && (
                            <span className="flex items-center gap-1">
                              <FaCalendarCheck size={12} />
                              Due:{" "}
                              {new Date(work.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {work.completedAt && (
                            <span className="flex items-center gap-1 font-bold text-lux-emerald">
                              <FaCalendarCheck size={12} />
                              Completed:{" "}
                              {new Date(
                                work.completedAt,
                              ).toLocaleDateString()}{" "}
                              {new Date(
                                work.completedAt,
                              ).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
          </section>

          <DashboardBlogSection />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default Dashboard;
