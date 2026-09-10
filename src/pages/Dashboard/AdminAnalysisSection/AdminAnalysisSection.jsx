import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaBrain, FaChartPie, FaFilter, FaSyncAlt } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DateRangeSelector from "../../../common/DateSelector/DateRangeSelector";
import Loading from "../../../common/Loading/Loading";

const COLORS = ["#0f766e", "#2563eb", "#ea580c", "#7c3aed", "#ca8a04", "#dc2626"];
const money = (value) => `Rs ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
const tons = (value) => `${(Number(value) || 0).toFixed(3)} tons`;
const chartValue = (value, name) => [name?.toLowerCase().includes("ton") || name === "Quantity" ? tons(value) : money(value), name];

const AdminAnalysisSection = () => {
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [filters, setFilters] = useState({ sellerCompany: "", buyerCompany: "", startDate: "", endDate: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCompanies = async () => {
    try {
      const [sellers, buyers] = await Promise.all([
        api.get("/seller-company", { params: { limit: 0 } }),
        api.get("/companies", { params: { limit: 0 } }),
      ]);
      setSellerCompanies(sellers.data?.data || []);
      setBuyerCompanies(buyers.data?.data || []);
    } catch {
      toast.error("Failed to load company filters");
    }
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/admin-analysis", { params: filters });
      setReport(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load analysis report");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadCompanies(); }, []);
  useEffect(() => { loadReport(); }, [loadReport]);

  const monthly = useMemo(() => {
    const months = new Set([
      ...(report?.saudaByMonth || []).map((item) => item.month),
      ...(report?.loadingByMonth || []).map((item) => item.month),
      ...(report?.paymentByMonth || []).map((item) => item.month),
    ]);
    return [...months].sort().map((month) => ({
      month,
      value: report?.saudaByMonth?.find((item) => item.month === month)?.value || 0,
      quantity: report?.saudaByMonth?.find((item) => item.month === month)?.quantity || 0,
      loadedWeight: report?.loadingByMonth?.find((item) => item.month === month)?.weight || 0,
      unloadingWeight: report?.loadingByMonth?.find((item) => item.month === month)?.unloadingWeight || 0,
      payments: report?.paymentByMonth?.find((item) => item.month === month)?.amount || 0,
    }));
  }, [report]);

  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value || "" }));
  const clearFilters = () => setFilters({ sellerCompany: "", buyerCompany: "", startDate: "", endDate: "" });

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-5 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700"><FaChartPie /> Admin intelligence report</div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Sauda, loading & payment analysis</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Compare companies, follow monthly value, and understand commodity movement from one filtered report.</p>
          </div>
          <button type="button" onClick={loadReport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"><FaSyncAlt /> Refresh report</button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <DataDropdown options={[{ value: "", label: "All seller companies" }, ...sellerCompanies.map((item) => ({ value: item.companyName, label: item.companyName }))]} selectedOptions={filters.sellerCompany} onChange={(item) => setFilter("sellerCompany", item?.value)} placeholder="Select seller company" isClearable />
          <DataDropdown options={[{ value: "", label: "All buyer companies" }, ...buyerCompanies.map((item) => ({ value: item.companyName, label: item.companyName }))]} selectedOptions={filters.buyerCompany} onChange={(item) => setFilter("buyerCompany", item?.value)} placeholder="Select buyer company" isClearable />
          <div className="md:col-span-2"><DateRangeSelector startDate={filters.startDate} endDate={filters.endDate} onStartDateChange={(date) => setFilter("startDate", date)} onEndDateChange={(date) => setFilter("endDate", date)} onClear={() => setFilters((current) => ({ ...current, startDate: "", endDate: "" }))} /></div>
          <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 md:col-start-2 xl:col-start-4"><FaFilter /> Clear filters</button>
        </div>

        {loading ? <Loading /> : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
              {[['Saudas', report?.summary?.saudas], ['Sauda value', money(report?.summary?.value)], ['Quantity', tons(report?.summary?.quantity)], ['Loaded weight', tons(report?.summary?.loadedWeight)], ['Unloading', tons(report?.summary?.unloadingWeight)], ['Rejected lorries', report?.summary?.rejectedLorries], ['Total works', report?.summary?.totalWorks]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{value || 0}</p></div>)}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><FaBrain className="mt-0.5 shrink-0 text-emerald-600" /><span>{report?.insights}</span></div>
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Chart title="Monthly sauda value & quantity"><ResponsiveContainer width="100%" height={280}><LineChart data={monthly}><CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#64748b" /><YAxis yAxisId="left" stroke="#64748b" /><YAxis yAxisId="right" orientation="right" stroke="#64748b" /><Tooltip formatter={chartValue} /><Legend /><Line yAxisId="left" type="monotone" dataKey="value" name="Value" stroke="#059669" strokeWidth={3} /><Line yAxisId="right" type="monotone" dataKey="quantity" name="Quantity" stroke="#2563eb" strokeWidth={3} /></LineChart></ResponsiveContainer></Chart>
              <Chart title="Commodity value distribution"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={report?.commodityStats || []} dataKey="value" nameKey="commodity" cx="50%" cy="50%" outerRadius={95} label={(item) => item.commodity}>{(report?.commodityStats || []).map((item, index) => <Cell key={item.commodity} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /><Legend /></PieChart></ResponsiveContainer></Chart>
              <Chart title="Loading, unloading & payments by month"><ResponsiveContainer width="100%" height={280}><BarChart data={monthly}><CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip /><Legend /><Bar dataKey="loadedWeight" name="Loading (tons)" fill="#f59e0b" radius={[5, 5, 0, 0]} /><Bar dataKey="unloadingWeight" name="Unloading (tons)" fill="#0f766e" radius={[5, 5, 0, 0]} /><Bar dataKey="payments" name="Payments" fill="#7c3aed" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Chart>
              <Chart title="Commodity performance"><ResponsiveContainer width="100%" height={280}><BarChart data={report?.commodityStats || []} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis type="number" stroke="#94a3b8" /><YAxis type="category" dataKey="commodity" width={90} stroke="#94a3b8" /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="value" name="Value" fill="#2dd4bf" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Chart>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const Chart = ({ title, children }) => <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3>{children}</div>;

export default AdminAnalysisSection;