import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaCalendarAlt, FaDownload, FaFileInvoiceDollar } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext/AuthContext";
import api from "../../utils/apiClient/apiClient";

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  new Date(2000, index, 1).toLocaleString("en-IN", { month: "short" }),
);
const CURRENT_YEAR = new Date().getFullYear();
const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const ExpenseDashboard = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "Admin";
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [employeeId, setEmployeeId] = useState("");
  const [expenseSort, setExpenseSort] = useState("amount-desc");
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef(null);

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - index),
    [],
  );

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    const fetchEmployees = async () => {
      try {
        const response = await api.get("/expense-requests/employees");
        if (!Array.isArray(response.data)) {
          throw new Error("Employee list response is invalid");
        }
        if (active) setEmployees(response.data);
      } catch (error) {
        console.error("Expense dashboard employee lookup failed:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to load employees for expense dashboard",
        );
      }
    };

    fetchEmployees();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get("/expense-requests/analytics", {
          params: {
            year,
            month,
            expenseSort: isAdmin ? expenseSort : "date-desc",
            ...(isAdmin && employeeId ? { employeeId } : {}),
          },
        });
        if (active) setAnalytics(response.data);
      } catch (error) {
        console.error("Expense dashboard analytics failed:", error);
        if (active) {
          setAnalytics(null);
          toast.error(
            error.response?.data?.message ||
              "Failed to load expense dashboard",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      active = false;
    };
  }, [employeeId, expenseSort, isAdmin, month, year]);

  const yearlyData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const chartYear = year - 5 + index;
        const record = analytics?.yearly?.find(
          (item) => Number(item._id) === chartYear,
        );
        return {
          label: String(chartYear),
          amount: record?.amount || 0,
          count: record?.count || 0,
        };
      }),
    [analytics, year],
  );

  const monthlyData = useMemo(
    () =>
      MONTHS.map((label, index) => {
        const record = analytics?.monthly?.find(
          (item) => Number(item._id) === index + 1,
        );
        return { label, amount: record?.amount || 0, count: record?.count || 0 };
      }),
    [analytics],
  );

  const dailyData = useMemo(
    () =>
      (analytics?.daily || []).map((item) => ({
        ...item,
        label: new Date(`${item._id}T12:00:00`).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      })),
    [analytics],
  );

  const selectedMonthLabel = `${MONTHS[month - 1]} ${year}`;

  const downloadExpenseImage = async () => {
    if (!dashboardRef.current || loading || exporting || !analytics) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: "#fffdf8",
        scale: Math.min(Math.max(window.devicePixelRatio * 2, 2), 3),
        imageTimeout: 0,
        removeContainer: true,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.dataset.exportControl === "true",
        onclone: (documentClone) => {
          documentClone
            .querySelectorAll("[data-expense-dashboard] .max-h-72")
            .forEach((element) => {
              element.style.maxHeight = "none";
              element.style.overflow = "visible";
            });
          documentClone
            .querySelectorAll("[data-expense-dashboard] .sticky")
            .forEach((element) => {
              element.style.position = "static";
            });
        },
      });
      const link = document.createElement("a");
      const selectedEmployee = employees.find(
        (employee) => employee._id === employeeId,
      );
      const employeeSuffix = selectedEmployee
        ? `-${String(selectedEmployee.name || "employee").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`
        : "";
      link.download = `expense-details-${year}-${String(month).padStart(2, "0")}${employeeSuffix}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Expense details image downloaded");
    } catch (error) {
      console.error("Expense dashboard image export failed:", error);
      toast.error("Unable to download expense details image");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section
      ref={dashboardRef}
      data-expense-dashboard
      className="lux-card lux-gold-top space-y-5 p-4 sm:p-6 lg:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lux-eyebrow mb-1">Expense Overview</p>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-lux-ink sm:text-2xl">
            <FaFileInvoiceDollar className="text-lux-emerald" aria-hidden />
            {isAdmin ? "Employee Expenses" : "My Expenses"}
          </h2>
          <p className="mt-1 text-sm text-lux-muted">
            Monthly trends, daily totals, and voucher activity.
          </p>
        </div>
        <div data-export-control="true" className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={downloadExpenseImage}
                disabled={loading || exporting || !analytics}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-3 text-xs font-bold text-lux-gold-soft shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaDownload aria-hidden />
                {exporting ? "Preparing image..." : "Download image"}
              </button>
              <select
                aria-label="Filter expenses by employee"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="min-h-10 rounded-xl border border-[#e6dcc4] bg-white px-3 text-sm text-lux-ink outline-none focus:border-lux-emerald"
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name || "Unnamed employee"}
                  </option>
                ))}
              </select>
            </>
          )}
          <select
            data-export-control="true"
            aria-label="Expense month"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className="min-h-10 rounded-xl border border-[#e6dcc4] bg-white px-3 text-sm text-lux-ink outline-none focus:border-lux-emerald"
          >
            {MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {new Date(year, index, 1).toLocaleString("en-IN", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            data-export-control="true"
            aria-label="Expense year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="min-h-10 rounded-xl border border-[#e6dcc4] bg-white px-3 text-sm text-lux-ink outline-none focus:border-lux-emerald"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-[#e6dcc4] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lux-muted">
            Total for {year}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-lux-ink">
            {loading ? "…" : formatCurrency(analytics?.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-lux-muted">
            {analytics?.totalCount || 0} vouchers
          </p>
        </article>
        <article className="rounded-xl border border-[#e6dcc4] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lux-muted">
            Total for {selectedMonthLabel}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-lux-ink">
            {loading
              ? "…"
              : formatCurrency(
                  analytics?.monthly?.find(
                    (item) => Number(item._id) === month,
                  )?.amount,
                )}
          </p>
          <p className="mt-1 text-xs text-lux-muted">
            {analytics?.daily?.reduce((sum, item) => sum + item.count, 0) || 0}{" "}
            vouchers
          </p>
        </article>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-lux-muted">
          Loading expense analytics…
        </div>
      ) : !analytics ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Expense analytics could not be loaded.
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-[#e6dcc4] bg-white p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold text-lux-ink">
                Year-wise expenses · {year - 5}–{year}
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#eee8d9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `₹${value}`}
                      width={58}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Expenses"]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Bar
                      dataKey="amount"
                      name="Expenses"
                      fill="#0f766e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-[#e6dcc4] bg-white p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold text-lux-ink">
                Month-wise expenses · {year}
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#eee8d9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `₹${value}`}
                      width={58}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Expenses"]}
                      labelFormatter={(label) => `${label} ${year}`}
                    />
                    <Bar
                      dataKey="amount"
                      name="Expenses"
                      fill="#087f5b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-[#e6dcc4] bg-white p-3 sm:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-lux-ink">
                <FaCalendarAlt className="text-lux-emerald" aria-hidden />
                Date-wise expenses · {selectedMonthLabel}
              </h3>
              <div className="h-56 w-full">
                {dailyData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#eee8d9" vertical={false} />
                      <XAxis
                        dataKey="label"
                        interval={2}
                        angle={-35}
                        textAnchor="end"
                        height={44}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `₹${value}`}
                        width={58}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), "Expenses"]}
                        labelFormatter={(label) => label}
                      />
                      <Bar
                        dataKey="amount"
                        name="Expenses"
                        fill="#b7791f"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-lux-muted">
                    No expenses for {selectedMonthLabel}.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {isAdmin && (
              <div className="overflow-hidden rounded-xl border border-[#e6dcc4] bg-white">
                <h3 className="border-b border-[#eee8d9] px-4 py-3 text-sm font-semibold text-lux-ink">
                  Employee-wise totals · {year}
                </h3>
                {analytics.employees?.length ? (
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-lux-cream text-xs uppercase text-lux-muted">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Employee</th>
                          <th className="px-4 py-2 text-right font-semibold">Vouchers</th>
                          <th className="px-4 py-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.employees.map((employee) => (
                          <tr key={employee.employeeId} className="border-t border-[#f0eadc]">
                            <td className="px-4 py-2 font-medium text-lux-ink">
                              {employee.name}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums text-lux-muted">
                              {employee.count}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold tabular-nums text-lux-ink">
                              {formatCurrency(employee.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-lux-muted">
                    No expenses recorded for {year}.
                  </p>
                )}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[#e6dcc4] bg-white">
              <div className="flex flex-col gap-2 border-b border-[#eee8d9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-lux-ink">
                  {isAdmin ? "Expense-sorted vouchers" : "My vouchers"} ·{" "}
                  {selectedMonthLabel}
                </h3>
                {isAdmin && (
                  <select
                    aria-label="Sort expenses"
                    value={expenseSort}
                    onChange={(event) => setExpenseSort(event.target.value)}
                    className="min-h-9 rounded-lg border border-[#e6dcc4] bg-white px-2 text-xs text-lux-ink outline-none focus:border-lux-emerald"
                  >
                    <option value="amount-desc">Amount: high to low</option>
                    <option value="amount-asc">Amount: low to high</option>
                    <option value="date-desc">Date: newest first</option>
                    <option value="date-asc">Date: oldest first</option>
                  </select>
                )}
              </div>
              {analytics.recentExpenses?.length ? (
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-lux-cream text-xs uppercase text-lux-muted">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Date / Voucher</th>
                        {isAdmin && (
                          <th className="px-4 py-2 font-semibold">Employee</th>
                        )}
                        <th className="px-4 py-2 text-right font-semibold">Amount</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentExpenses.map((expense) => (
                        <tr key={expense._id} className="border-t border-[#f0eadc]">
                          <td className="px-4 py-2 text-lux-ink">
                            <span className="block font-medium">
                              {new Date(expense.createdAt).toLocaleDateString(
                                "en-IN",
                                { timeZone: "Asia/Kolkata" },
                              )}
                            </span>
                            <span className="text-xs text-lux-muted">
                              #{expense.voucherNumber || "—"}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-2 text-lux-ink">
                              {expense.employee?.name || "Unknown"}
                            </td>
                          )}
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-lux-ink">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-4 py-2 capitalize text-lux-muted">
                            {expense.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-4 text-sm text-lux-muted">
                  No vouchers for {selectedMonthLabel}.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ExpenseDashboard;
