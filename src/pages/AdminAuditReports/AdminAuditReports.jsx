import { lazy, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaUsers, FaUserCheck, FaHistory, FaEye, FaTimes } from "react-icons/fa";
import api from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
const AdminPageShell = lazy(
  () => import("../../common/AdminPageShell/AdminPageShell"),
);
const SearchBox = lazy(() => import("../../common/SearchBox/SearchBox"));
const Pagination = lazy(() => import("../../common/Paginations/Paginations"));
const Tables = lazy(() => import("../../common/Tables/Tables"));

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
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get("/audit-reports/login-summary");
      setSummary(
        response.data || {
          buyers: { totalUsers: 0, totalLogins: 0, onlineNow: 0 },
          sellers: { totalUsers: 0, totalLogins: 0, onlineNow: 0 },
          admins: { totalAdmins: 0, onlineNow: 0 },
        },
      );
    } catch (error) {
      console.error("Failed to load login summary", error);
    }
  }, []);

  const handleSearch = useCallback((query) => {
    setPage(1);
    setSearch(query);
  }, []);

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/audit-reports/buyer-seller-activity", {
        skipCache: true,
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
      toast.error(
        error?.response?.data?.message || "Failed to load audit report",
      );
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

  const tableHeaders = [
    "Type",
    "Name",
    "Contact",
    "Email",
    "Status",
    "Login Count",
    "Last Login",
    "Last Active",
    "Login IP",
    "Online",
    "Actions",
  ];

  const tableRows = records.map((record) => [
    <span key="type" className="font-medium text-slate-700">
      {record.type}
    </span>,
    <span key="name" className="font-semibold text-slate-900">
      {record.name}
    </span>,
    record.contact,
    record.email,
    <span
      key="status"
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${record.status === "Active" || record.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
    >
      {record.status}
    </span>,
    record.loginCount,
    formatDate(record.lastLoginAt),
    formatDate(record.lastActiveAt),
    <span key="ip" className="font-mono text-xs">
      {record.lastLoginIp}
    </span>,
    <span
      key="online"
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${record.isLoggedIn ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}
    >
      {record.isLoggedIn ? "Online" : "Offline"}
    </span>,
    <button
      key="view"
      type="button"
      onClick={() => setSelectedRecord(record)}
      title={`View ${record.type.toLowerCase()} usage`}
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
    >
      <FaEye size={12} />
      View
    </button>,
  ]);

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
            <div className="mt-3 text-2xl font-black text-slate-900">
              {summary.buyers.totalUsers}
            </div>
            <div className="text-xs text-slate-600">
              Online now: {summary.buyers.onlineNow}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between text-blue-700">
              <FaUsers className="text-xl" />
              <span className="text-xs font-bold uppercase">Sellers</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {summary.sellers.totalUsers}
            </div>
            <div className="text-xs text-slate-600">
              Online now: {summary.sellers.onlineNow}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center justify-between text-violet-700">
              <FaUserCheck className="text-xl" />
              <span className="text-xs font-bold uppercase">Admins</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {summary.admins.totalAdmins || 0}
            </div>
            <div className="text-xs text-slate-600">
              Online now: {summary.admins.onlineNow || 0}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between text-amber-700">
              <FaHistory className="text-xl" />
              <span className="text-xs font-bold uppercase">Logins</span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {(summary.buyers.totalLogins || 0) +
                (summary.sellers.totalLogins || 0)}
            </div>
            <div className="text-xs text-slate-600">
              Combined buyer & seller usage
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchBox
              placeholder="Search buyer or seller"
              items={[]}
              value={search}
              onSearch={handleSearch}
              returnQuery
              className="max-w-xl"
            />

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600">
                Status
              </label>
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

        {loading ? (
          <Loading />
        ) : (
          <Tables headers={tableHeaders} rows={tableRows} />
        )}

        {selectedRecord && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Account usage details
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {selectedRecord.name}
                </h2>
                <p className="text-sm text-slate-600">
                  {selectedRecord.type} account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                title="Close details"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Login count", selectedRecord.loginCount || 0],
                ["Last login", formatDate(selectedRecord.lastLoginAt)],
                ["Last active", formatDate(selectedRecord.lastActiveAt)],
                ["Current status", selectedRecord.isLoggedIn ? "Online" : "Offline"],
                ["Contact", selectedRecord.contact],
                ["Email", selectedRecord.email],
                ["Login IP", selectedRecord.lastLoginIp],
                ["Account status", selectedRecord.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={limit}
          onPageChange={(nextPage) => setPage(Number(nextPage) || 1)}
        />
      </div>
    </AdminPageShell>
  );
};

export default AdminAuditReports;
