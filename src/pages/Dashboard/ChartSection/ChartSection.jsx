import { useState, lazy, Suspense, memo, useMemo } from "react";
import {
  FaChartLine,
  FaChartBar,
  FaThLarge,
  FaStream,
  FaBolt,
  FaCalendarAlt,
} from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";

const SaudaChart = lazy(
  () => import("../../../common/Charts/SaudaChart/SaudaChart"),
);
const BidChart = lazy(() => import("../../../common/Charts/BidChart/BidChart"));
const AgentSaudaChart = lazy(
  () => import("../../../common/Charts/AgentSaudaChart/AgentSaudaChart"),
);
const LoadingChart = lazy(
  () => import("../../../common/Charts/LoadingChart/LoadingChart"),
);
const PaymentAnalyticsChart = lazy(
  () =>
    import("../../../common/Charts/PaymentAnalyticsChart/PaymentAnalyticsChart"),
);
const CommodityPieChart = lazy(
  () => import("../../../common/Charts/CommodityPieChart/CommodityPieChart"),
);

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const CHART_CARDS = [
  {
    id: "payment",
    featured: true,
    label: "Payments",
    accent: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-100/80",
    Component: PaymentAnalyticsChart,
    props: (chartType, filters) => ({ 
      apiUrl: `/dashboard/charts/payments?month=${filters.month}&year=${filters.year}`, 
      chartType 
    }),
  },
  {
    id: "loading",
    label: "Loading",
    accent: "from-blue-500 to-indigo-600",
    ring: "ring-blue-100/80",
    Component: LoadingChart,
    props: (chartType, filters) => ({ 
      apiUrl: `/dashboard/charts/loading?month=${filters.month}&year=${filters.year}`, 
      chartType 
    }),
  },
  {
    id: "commodity",
    label: "Commodity",
    accent: "from-emerald-500 to-cyan-600",
    ring: "ring-emerald-100/80",
    Component: CommodityPieChart,
    props: (_, filters) => ({ 
      apiUrl: `/dashboard/charts/loading?month=${filters.month}&year=${filters.year}` 
    }),
  },
  {
    id: "sauda",
    label: "Sauda",
    accent: "from-emerald-500 to-green-600",
    ring: "ring-emerald-100/80",
    Component: SaudaChart,
    props: (chartType, filters) => ({ 
      apiUrl: `/dashboard/charts/sauda?month=${filters.month}&year=${filters.year}`, 
      chartType 
    }),
  },
  {
    id: "sauda-pie",
    label: "Sauda mix",
    accent: "from-emerald-500 to-green-600",
    ring: "ring-emerald-100/80",
    Component: SaudaChart,
    props: (_, filters) => ({ 
      apiUrl: `/dashboard/charts/sauda?month=${filters.month}&year=${filters.year}`, 
      chartType: "pie" 
    }),
  },
  {
    id: "bids",
    label: "Bids",
    accent: "from-amber-500 to-orange-600",
    ring: "ring-amber-100/80",
    Component: BidChart,
    props: (chartType, filters) => ({ 
      apiUrl: `/dashboard/charts/bids?month=${filters.month}&year=${filters.year}`, 
      chartType 
    }),
  },
  {
    id: "bids-pie",
    label: "Bid mix",
    accent: "from-amber-500 to-orange-600",
    ring: "ring-amber-100/80",
    Component: BidChart,
    props: (_, filters) => ({ 
      apiUrl: `/dashboard/charts/bids?month=${filters.month}&year=${filters.year}`, 
      chartType: "pie" 
    }),
  },
  {
    id: "agent",
    label: "Agents",
    accent: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-100/80",
    Component: AgentSaudaChart,
    props: (chartType, filters) => ({ 
      apiUrl: `/dashboard/charts/agent-distribution?month=${filters.month}&year=${filters.year}`, 
      chartType 
    }),
  },
  {
    id: "agent-pie",
    label: "Agent mix",
    accent: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-100/80",
    Component: AgentSaudaChart,
    props: (_, filters) => ({ 
      apiUrl: `/dashboard/charts/agent-distribution?month=${filters.month}&year=${filters.year}`, 
      chartType: "pie" 
    }),
  },
];

const ChartCard = memo(({ featured, label, accent, ring, children }) => (
  <article
    className={[
      "relative min-w-0 flex flex-col",
      "rounded-2xl sm:rounded-[1.75rem] lg:rounded-[2rem]",
      "border border-slate-200/70 bg-white/90 backdrop-blur-xl",
      "shadow-[0_4px_24px_rgba(15,23,42,0.06)]",
      "p-4 sm:p-6 lg:p-8",
      "transition-all duration-500 ease-out",
      "hover:shadow-[0_16px_48px_rgba(79,70,229,0.12)] hover:border-indigo-200/60",
      "group overflow-hidden",
      featured ? "lg:col-span-2" : "",
      ring,
      "ring-1",
    ].join(" ")}
  >
    <div
      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent} opacity-80`}
      aria-hidden
    />
    {label && (
      <span className="sr-only">{label} chart</span>
    )}
    {featured && (
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
          <FaBolt className="text-[8px]" aria-hidden />
          Primary
        </span>
      </div>
    )}
    <div className="relative z-[1] min-w-0 flex-1">{children}</div>
    <div
      className={`pointer-events-none absolute -bottom-8 -right-8 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br ${accent} opacity-[0.07] group-hover:scale-125 transition-transform duration-700`}
      aria-hidden
    />
  </article>
));

ChartCard.displayName = "ChartCard";

const ChartSection = memo(() => {
  const [chartType, setChartType] = useState("line");
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const yearList = [];
    for (let y = currentYear; y >= startYear; y--) {
      yearList.push(y);
    }
    return yearList;
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <section
        className="w-full min-w-0"
        aria-labelledby="market-intelligence-heading"
      >
        {/* Header + controls */}
        <header className="mb-6 sm:mb-8 lg:mb-10 space-y-5 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 bg-indigo-500 blur-xl opacity-25"
                  aria-hidden
                />
                <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-300/40">
                  <FaChartLine
                    className="text-white text-lg sm:text-xl"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                  Live analytics
                </p>
                <h2
                  id="market-intelligence-heading"
                  className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight"
                >
                  Market{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Intelligence
                  </span>
                </h2>
                <div className="h-1 w-10 sm:w-12 bg-gradient-to-r from-indigo-600 to-violet-400 rounded-full mt-2" />
              </div>
            </div>

            {/* Month/Year Selection Filters */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/80 shadow-sm self-start lg:self-center">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/50">
                <FaCalendarAlt className="text-indigo-500 text-xs" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Period Selection</span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={filters.month}
                  onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="appearance-none bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="appearance-none bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer min-w-[100px]"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 w-full">
            <div
              className="grid grid-cols-2 gap-1.5 sm:inline-flex sm:gap-0 rounded-xl sm:rounded-2xl bg-slate-100/90 backdrop-blur-md p-1 sm:p-1.5 border border-slate-200/80 shadow-inner w-full sm:w-auto"
              role="group"
              aria-label="Chart visualization type"
            >
              {[
                { id: "line", label: "Linear", icon: FaChartLine },
                { id: "bar", label: "Columnar", icon: FaChartBar },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={[
                    "flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-[0.85rem] transition-all duration-300",
                    chartType === type.id
                      ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                  aria-pressed={chartType === type.id}
                >
                  <type.icon className="text-xs sm:text-sm" aria-hidden />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>

            <div
              className="grid grid-cols-2 gap-1.5 sm:inline-flex sm:gap-0 rounded-xl sm:rounded-2xl bg-slate-100/90 backdrop-blur-md p-1 sm:p-1.5 border border-slate-200/80 shadow-inner w-full sm:w-auto"
              role="group"
              aria-label="View mode"
            >
              {[
                { id: "grid", label: "Compact", icon: FaThLarge },
                { id: "list", label: "Detailed", icon: FaStream },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={[
                    "flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-[0.85rem] transition-all duration-300",
                    viewMode === mode.id
                      ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                  aria-pressed={viewMode === mode.id}
                >
                  <mode.icon className="text-xs sm:text-sm" aria-hidden />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                    {mode.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div
          className={[
            "grid gap-6 sm:gap-8 lg:gap-10",
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
              : "grid-cols-1",
          ].join(" ")}
        >
          {CHART_CARDS.map((card) => (
            <ChartCard
              key={card.id}
              featured={card.featured && viewMode === "grid"}
              label={card.label}
              accent={card.accent}
              ring={card.ring}
            >
              <card.Component {...card.props(chartType, filters)} />
            </ChartCard>
          ))}
        </div>
      </section>
    </Suspense>
  );
});

ChartSection.displayName = "ChartSection";

export default ChartSection;
