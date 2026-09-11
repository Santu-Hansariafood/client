import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaUsers, FaUserCheck, FaSearch, FaShieldAlt, FaHistory } from "react-icons/fa";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import api from "../../utils/apiClient/apiClient";

const formatDate = (value) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const AdminAuditReports = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    buyers: { totalUsers: 0, totalLogins: 0, onlineNow: 0 },
    sellers: { totalUsers: 0, totalLogins: 0, onlineNow: 0 },
    admins: { totalAdmins: 0, onlineNow: 0 },
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get("/audit-reports/login-summary");
      setSummary(response.data || summary);
    } catch (error) {
      console.error("Failed to load login summary", error);
    }
  }, [summary]);

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/audit-reports/buyer-seller-activity", {
        params: {
          search,
          status,
          page,
          limit,
        },
      });

      setRecords(response.data?.data || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load audit report");
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [limit, total]);

  return (
    <AdminPageShell
      title="Buyer & Seller Audit Report"
      subtitle="Track account usage, login activity, and current online status for buyer and seller accounts."
    >
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between text-emerald-700">
              <FaUsers className="text-xl" />
              <span className="text-xs font-bold uppercase">Buyers</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">{summary.buyers.totalUsers}</div>
            <div className="text-xs text-slate-600">Online now: {summary.buyers.onlineNow}</div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between text-blue-700">
              <FaUsers className="text-xl" />
              <span className="text-xs font-bold uppercase">Sellers</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">{summary.sellers.totalUsers}</div>
            <div className="text-xs text-slate-600">Online now: {summary.sellers.onlineNow}</div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center justify-between text-violet-700">
              <FaUserCheck className="text-xl" />
              <span className="text-xs font-bold uppercase">Admins</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">{summary.admins.totalAdmins || 0}</div>
            <div className="text-xs text-slate-600">Online now: {summary.admins.onlineNow || 0}</div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between text-amber-700">
              <FaHistory className="text-xl" />
              <span className="text-xs font-bold uppercase">Logins</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">{(summary.buyers.totalLogins || 0) + (summary.sellers.totalLogins || 0)}</div>
            <div className="text-xs text-slate-600">Combined buyer & seller usage</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <FaSearch className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Search buyer or seller"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Login Count</th>
                  <th className="px-4 py-3 font-semibold">Last Login</th>
                  <th className="px-4 py-3 font-semibold">Last Active</th>
                  <th className="px-4 py-3 font-semibold">Online</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-slate-500">
                      Loading audit data...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-slate-500">
                      No buyer or seller records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={`${record.type}-${record._id}`} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{record.type}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{record.name}</td>
                      <td className="px-4 py-3 text-slate-600">{record.contact}</td>
                      <td className="px-4 py-3 text-slate-600">{record.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${record.status === "Active" || record.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{record.loginCount}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(record.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(record.lastActiveAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${record.isLoggedIn ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                          {record.isLoggedIn ? "Online" : "Offline"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-sm text-slate-600">
            Showing {records.length} of {total} records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-700">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminAuditReports;
