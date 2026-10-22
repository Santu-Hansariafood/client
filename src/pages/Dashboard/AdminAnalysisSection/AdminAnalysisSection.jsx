import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
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
import { FaBrain, FaChartPie, FaDownload, FaFilter, FaSyncAlt } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DateRangeSelector from "../../../common/DateSelector/DateRangeSelector";
import Loading from "../../../common/Loading/Loading";

const COLORS = ["#065f46", "#0d7a68", "#12a594", "#c9a227", "#e6cf86", "#b8860b"];
const money = (value) => `Rs ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
const tons = (value) => `${(Number(value) || 0).toFixed(3)} tons`;
const chartValue = (value, name) => [name?.toLowerCase().includes("ton") || name === "Quantity" ? tons(value) : money(value), name];

const AdminAnalysisSection = () => {
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [filters, setFilters] = useState({ sellerCompany: "", buyerCompany: "", startDate: "", endDate: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const chartStackRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return undefined;

    let frameId;

    const updateParallax = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight / 2;
        chartStackRef.current
          ?.querySelectorAll("[data-parallax-chart]")
          .forEach((chart, index) => {
            const chartCenter = chart.getBoundingClientRect().top + chart.offsetHeight / 2;
            const progress = Math.max(
              -1,
              Math.min(1, (chartCenter - viewportCenter) / viewportCenter),
            );
            chart.style.setProperty("--scroll-shift", `${progress * -28}px`);
            chart.style.setProperty("--scroll-tilt", `${progress * -5}deg`);
            chart.style.setProperty("--scroll-turn", `${(index % 2 ? 1 : -1) * progress * 1.5}deg`);
            chart.style.setProperty("--scroll-scale", `${1 - Math.abs(progress) * 0.012}`);
          });
      });
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateParallax);
      window.removeEventListener("resize", updateParallax);
    };
  }, []);

  const loadCompanies = async () => {
    try {
      const [sellers, buyers] = await Promise.all([
        api.get("/seller-company", { params: { limit: 0 } }),
        api.get("/companies", { params: { limit: 0 } }),
      ]);
      setSellerCompanies(sellers.data?.data || []);
      setBuyerCompanies(
        Array.isArray(buyers.data)
          ? buyers.data
          : buyers.data?.data || [],
      );
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

  const downloadReportImage = async () => {
    if (!reportRef.current || loading || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#ffffff",
        scale: Math.min(Math.max(window.devicePixelRatio * 3, 3), 4),
        imageTimeout: 0,
        removeContainer: true,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.dataset.exportControl === "true",
        onclone: (documentClone) => {
          const reportClone = documentClone.querySelector("[data-admin-analysis-report]");
          if (reportClone) {
            reportClone.style.background = "linear-gradient(135deg, #fffefb 0%, #fdfbf6 52%, #f7f4ec 100%)";
            reportClone.style.boxShadow = "0 24px 70px rgba(6, 95, 70, 0.18)";
            reportClone.style.borderColor = "#e9e2d3";
          }
        },
      });
      const link = document.createElement("a");
      const dateLabel = new Date().toISOString().slice(0, 10);
      link.download = `admin-analysis-report-${dateLabel}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Report image downloaded");
    } catch (error) {
      console.error("Report image export error:", error);
      toast.error("Unable to download report image");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section data-admin-analysis-report ref={reportRef} className="lux-card lux-gold-top relative overflow-hidden rounded-[2rem] p-5 text-lux-ink sm:p-8">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-lux-gold/15 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="lux-eyebrow mb-2 flex items-center gap-2"><FaChartPie /> Admin intelligence report</div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-lux-ink sm:text-3xl">Sauda, loading &amp; payment analysis</h2>
            <p className="mt-2 max-w-2xl text-sm text-lux-muted">Compare companies, follow monthly value, and understand commodity movement from one filtered report.</p>
          </div>
          <div data-export-control="true" className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadReportImage} disabled={loading || exporting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-4 py-2.5 text-xs font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-sm transition hover:shadow-lg hover:shadow-lux-emerald/25 disabled:cursor-not-allowed disabled:opacity-60"><FaDownload /> {exporting ? "Preparing image..." : "Download image"}</button>
            <button type="button" onClick={loadReport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 py-2.5 text-xs font-bold text-lux-emerald shadow-sm transition hover:bg-white"><FaSyncAlt /> Refresh report</button>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-3 rounded-2xl border border-[#e9e2d3] bg-lux-cream/80 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <DataDropdown options={[{ value: "", label: "All seller companies" }, ...sellerCompanies.map((item) => ({ value: item.companyName, label: item.companyName }))]} selectedOptions={filters.sellerCompany} onChange={(item) => setFilter("sellerCompany", item?.value)} placeholder="Select seller company" isClearable />
          <DataDropdown options={[{ value: "", label: "All buyer companies" }, ...buyerCompanies.map((item) => ({ value: item.companyName, label: item.companyName }))]} selectedOptions={filters.buyerCompany} onChange={(item) => setFilter("buyerCompany", item?.value)} placeholder="Select buyer company" isClearable />
          <div className="md:col-span-2"><DateRangeSelector startDate={filters.startDate} endDate={filters.endDate} onStartDateChange={(date) => setFilter("startDate", date)} onEndDateChange={(date) => setFilter("endDate", date)} onClear={() => setFilters((current) => ({ ...current, startDate: "", endDate: "" }))} /></div>
          <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6dcc4] px-4 py-2 text-xs font-bold text-lux-muted transition hover:bg-lux-cream md:col-start-2 xl:col-start-4"><FaFilter /> Clear filters</button>
        </div>

        {loading ? <Loading /> : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
              {[['Saudas', report?.summary?.saudas], ['Sauda value', money(report?.summary?.value)], ['Quantity', tons(report?.summary?.quantity)], ['Loaded weight', tons(report?.summary?.loadedWeight)], ['Unloading', tons(report?.summary?.unloadingWeight)], ['Rejected lorries', report?.summary?.rejectedLorries], ['Total works', report?.summary?.totalWorks]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#ece5d6] bg-lux-cream p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-widest text-lux-muted">{label}</p><p className="mt-2 font-serif text-xl font-semibold text-lux-ink">{value || 0}</p></div>)}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-lux-gold/30 bg-lux-cream p-4 text-sm text-lux-ink"><FaBrain className="mt-0.5 shrink-0 text-lux-emerald" /><span>{report?.insights}</span></div>
            <div ref={chartStackRef} className="mt-6 grid grid-cols-1 gap-6 sm:gap-8">
              <Chart title="Monthly sauda value & quantity"><ResponsiveContainer width="100%" height={280}><LineChart data={monthly}><CartesianGrid stroke="#e0d8c6" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#5f6f68" /><YAxis yAxisId="left" stroke="#5f6f68" /><YAxis yAxisId="right" orientation="right" stroke="#5f6f68" /><Tooltip formatter={chartValue} /><Legend /><Line yAxisId="left" type="monotone" dataKey="value" name="Value" stroke="#065f46" strokeWidth={3} /><Line yAxisId="right" type="monotone" dataKey="quantity" name="Quantity" stroke="#c9a227" strokeWidth={3} /></LineChart></ResponsiveContainer></Chart>
              <Chart title="Commodity value distribution"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={report?.commodityStats || []} dataKey="value" nameKey="commodity" cx="50%" cy="50%" outerRadius={95} label={(item) => item.commodity}>{(report?.commodityStats || []).map((item, index) => <Cell key={item.commodity} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /><Legend /></PieChart></ResponsiveContainer></Chart>
              <Chart title="Loading, unloading & payments by month"><ResponsiveContainer width="100%" height={280}><BarChart data={monthly}><CartesianGrid stroke="#e0d8c6" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#5f6f68" /><YAxis stroke="#5f6f68" /><Tooltip /><Legend /><Bar dataKey="loadedWeight" name="Loading (tons)" fill="#c9a227" radius={[5, 5, 0, 0]} /><Bar dataKey="unloadingWeight" name="Unloading (tons)" fill="#065f46" radius={[5, 5, 0, 0]} /><Bar dataKey="payments" name="Payments" fill="#0d7a68" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Chart>
              <Chart title="Commodity performance"><ResponsiveContainer width="100%" height={280}><BarChart data={report?.commodityStats || []} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid stroke="#e0d8c6" strokeDasharray="3 3" /><XAxis type="number" stroke="#5f6f68" /><YAxis type="category" dataKey="commodity" width={90} stroke="#5f6f68" /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="value" name="Value" fill="#12a594" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Chart>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const Chart = ({ title, children }) => (
  <article data-parallax-chart className="admin-chart-card">
    <div className="admin-chart-card__glow" aria-hidden="true" />
    <div className="admin-chart-card__content">
      <h3 className="admin-chart-card__title">{title}</h3>
      <div className="admin-chart-card__plot">{children}</div>
    </div>
  </article>
);

export default AdminAnalysisSection;
