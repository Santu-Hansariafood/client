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
      payments: report?.paymentByMonth?.find((item) => item.month === month)?.amount || 0,
    }));
  }, [report]);

  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value || "" }));
  const clearFilters = () => setFilters({ sellerCompany: "", buyerCompany: "", startDate: "", endDate: "" });

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300"><FaChartPie /> Admin intelligence report</div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Sauda, loading & payment analysis</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Compare companies, follow monthly value, and understand commodity movement from one filtered report.</p>
          </div>
          <button type="button" onClick={loadReport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"><FaSyncAlt /> Refresh report</button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 md:grid-cols-2 xl:grid-cols-4">
          <DataDropdown options={[{ value: "", label: "All seller companies" }, ...sellerCompanies.map((item) => ({ value: item.companyName, label: item.companyName }))]} selectedOptions={filters.sellerCompany} onChange={(item) => setFilter("sellerCompany", item?.value)} placeholder="Select seller company" isClearable />
          <DataDropdown options={[{ value: "", label: "All buyer companies" }, ...buyerCompanies.map((item) => ({ value: item.companyName, label: item.companyName }))]} selectedOptions={filters.buyerCompany} onChange={(item) => setFilter("buyerCompany", item?.value)} placeholder="Select buyer company" isClearable />
          <div className="md:col-span-2"><DateRangeSelector startDate={filters.startDate} endDate={filters.endDate} onStartDateChange={(date) => setFilter("startDate", date)} onEndDateChange={(date) => setFilter("endDate", date)} onClear={() => setFilters((current) => ({ ...current, startDate: "", endDate: "" }))} /></div>
          <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 md:col-start-2 xl:col-start-4"><FaFilter /> Clear filters</button>
        </div>

        {loading ? <Loading /> : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[['Saudas', report?.summary?.saudas], ['Sauda value', money(report?.summary?.value)], ['Quantity', report?.summary?.quantity], ['Loaded weight', report?.summary?.loadedWeight], ['Payments', money(report?.summary?.payments)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-white">{value || 0}</p></div>)}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100"><FaBrain className="mt-0.5 shrink-0 text-emerald-300" /><span>{report?.insights}</span></div>
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Chart title="Monthly sauda value & quantity"><ResponsiveContainer width="100%" height={280}><LineChart data={monthly}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#94a3b8" /><YAxis yAxisId="left" stroke="#94a3b8" /><YAxis yAxisId="right" orientation="right" stroke="#94a3b8" /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="value" name="Value" stroke="#34d399" strokeWidth={3} /><Line yAxisId="right" type="monotone" dataKey="quantity" name="Quantity" stroke="#60a5fa" strokeWidth={3} /></LineChart></ResponsiveContainer></Chart>
              <Chart title="Commodity value distribution"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={report?.commodityStats || []} dataKey="value" nameKey="commodity" cx="50%" cy="50%" outerRadius={95} label={(item) => item.commodity}>{(report?.commodityStats || []).map((item, index) => <Cell key={item.commodity} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /><Legend /></PieChart></ResponsiveContainer></Chart>
              <Chart title="Loading and payments by month"><ResponsiveContainer width="100%" height={280}><BarChart data={monthly}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Legend /><Bar dataKey="loadedWeight" name="Loaded weight" fill="#f59e0b" radius={[5, 5, 0, 0]} /><Bar dataKey="payments" name="Payments" fill="#a78bfa" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Chart>
              <Chart title="Commodity performance"><ResponsiveContainer width="100%" height={280}><BarChart data={report?.commodityStats || []} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis type="number" stroke="#94a3b8" /><YAxis type="category" dataKey="commodity" width={90} stroke="#94a3b8" /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="value" name="Value" fill="#2dd4bf" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Chart>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const Chart = ({ title, children }) => <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><h3 className="mb-2 text-sm font-bold text-slate-200">{title}</h3>{children}</div>;

export default AdminAnalysisSection;