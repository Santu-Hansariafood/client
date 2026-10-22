import { lazy, useCallback, useEffect, useRef, useState } from "react";
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
  const requestSequence = useRef(0);

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

  const handlePageChange = useCallback((nextPage) => {
    setPage(Number(nextPage) || 1);
  }, []);

  const fetchAuditData = useCallback(async () => {
    const requestId = ++requestSequence.current;
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

      if (requestId !== requestSequence.current) return;

      setRecords(response.data?.data || []);
      setTotal(response.data?.total || 0);
      setSelectedRecord(null);
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      toast.error(
        error?.response?.data?.message || "Failed to load audit report",
      );
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
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
    "Login Device",
    "Online",
    "Actions",
  ];

  const tableRows = records.map((record) => [
    <span key="type" className="font-medium text-lux-ink">
      {record.type}
    </span>,
    <span key="name" className="font-semibold text-lux-ink">
      {record.name}
    </span>,
    record.contact,
    record.email,
    <span
      key="status"
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${record.status === "Active" || record.status === "active" ? "border-lux-emerald/30 bg-lux-ivory text-lux-emerald" : "border-rose-200 bg-rose-50 text-rose-600"}`}
    >
      {record.status}
    </span>,
    record.loginCount,
    formatDate(record.lastLoginAt),
    formatDate(record.lastActiveAt),
    <span key="ip" className="font-mono text-xs">
      {record.lastLoginIp}
    </span>,
    <span key="device" className="text-xs font-medium text-lux-ink">
      {record.lastLoginDevice}
    </span>,
    <span
      key="online"
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${record.isLoggedIn ? "border-lux-emerald/30 bg-lux-ivory text-lux-emerald" : "border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"}`}
    >
      {record.isLoggedIn ? "Online" : "Offline"}
    </span>,
    <button
      key="view"
      type="button"
      onClick={() => setSelectedRecord(record)}
      title={`View ${record.type.toLowerCase()} usage`}
      className="inline-flex items-center gap-2 rounded-xl border border-[#ece4d2] bg-lux-ivory px-3 py-2 text-xs font-bold text-lux-emerald transition-colors hover:bg-lux-cream"
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
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lux-card lux-gold-top p-4">
            <div className="flex items-center justify-between text-lux-emerald">
              <FaUsers className="text-xl" />
              <span className="font-serif text-xs font-bold uppercase tracking-widest">
                Buyers
              </span>
            </div>
            <div className="mt-3 font-serif text-2xl font-black text-lux-ink">
              {summary.buyers.totalUsers}
            </div>
            <div className="text-xs text-lux-muted">
              Online now: {summary.buyers.onlineNow}
            </div>
          </div>

          <div className="lux-card lux-gold-top p-4">
            <div className="flex items-center justify-between text-lux-emerald">
              <FaUsers className="text-xl" />
              <span className="font-serif text-xs font-bold uppercase tracking-widest">
                Sellers
              </span>
            </div>
            <div className="mt-3 font-serif text-2xl font-black text-lux-ink">
              {summary.sellers.totalUsers}
            </div>
            <div className="text-xs text-lux-muted">
              Online now: {summary.sellers.onlineNow}
            </div>
          </div>

          <div className="lux-card lux-gold-top p-4">
            <div className="flex items-center justify-between text-lux-emerald">
              <FaUserCheck className="text-xl" />
              <span className="font-serif text-xs font-bold uppercase tracking-widest">
                Admins
              </span>
            </div>
            <div className="mt-3 font-serif text-2xl font-black text-lux-ink">
              {summary.admins.totalAdmins || 0}
            </div>
            <div className="text-xs text-lux-muted">
              Online now: {summary.admins.onlineNow || 0}
            </div>
          </div>

          <div className="lux-card lux-gold-top p-4">
            <div className="flex items-center justify-between text-lux-emerald">
              <FaHistory className="text-xl" />
              <span className="font-serif text-xs font-bold uppercase tracking-widest">
                Logins
              </span>
            </div>
            <div className="mt-3 font-serif text-2xl font-black text-lux-ink">
              {(summary.buyers.totalLogins || 0) +
                (summary.sellers.totalLogins || 0)}
            </div>
            <div className="text-xs text-lux-muted">
              Combined buyer & seller usage
            </div>
          </div>
        </div>

        <div className="lux-card lux-gold-top p-4 sm:p-6">
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
              <label className="font-serif text-sm font-medium text-lux-ink">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="rounded-xl border border-[#ece4d2] bg-lux-cream px-3 py-2.5 text-sm outline-none focus:border-lux-emerald"
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

        {loading && records.length === 0 ? (
          <Loading />
        ) : (
          <Tables headers={tableHeaders} rows={tableRows} />
        )}

        {total > 0 && (
          <Pagination
            currentPage={page}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
          />
        )}

        {selectedRecord && (
          <div className="lux-card lux-gold-top p-4 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-xs font-bold uppercase tracking-widest text-lux-emerald">
                  Account usage details
                </p>
                <h2 className="mt-1 font-serif text-xl font-black text-lux-ink">
                  {selectedRecord.name}
                </h2>
                <p className="text-sm text-lux-muted">
                  {selectedRecord.type} account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                title="Close details"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-lux-muted hover:bg-lux-ivory hover:text-lux-ink"
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
                <div key={label} className="rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
                  <p className="font-serif text-[11px] font-bold uppercase tracking-widest text-lux-muted">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-lux-ink">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
};

export default AdminAuditReports;
