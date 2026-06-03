import { useState, lazy, Suspense, memo, useMemo } from "react";
import {
  FaChartLine,
  FaChartBar,
  FaBolt,
  FaCalendarAlt,
  FaWallet,
  FaTruckLoading,
  FaGlobeAmericas,
} from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import SariaAiBrand from "../../../common/SariaAiBrand/SariaAiBrand";
import AIInsights from "../AIInsights/AIInsights";

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
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const CHART_PARTS = [
  {
    title: "Financial Intelligence",
    icon: FaWallet,
    color: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/25",
    description: "Revenue & payment flow",
    cards: [
      {
        id: "payment",
        featured: true,
        label: "Payments",
        accent: "from-emerald-500 to-teal-600",
        Component: PaymentAnalyticsChart,
        props: (chartType, filters) => ({
          apiUrl: `/dashboard/charts/payments?month=${filters.month}&year=${filters.year}`,
          chartType,
        }),
      },
    ],
  },
  {
    title: "Logistics & Operations",
    icon: FaTruckLoading,
    color: "from-blue-400 to-indigo-500",
    glow: "shadow-blue-500/25",
    description: "Loading & commodity mix",
    cards: [
      {
        id: "loading",
        label: "Loading",
        accent: "from-blue-500 to-indigo-600",
        Component: LoadingChart,
        props: (chartType, filters) => ({
          apiUrl: `/dashboard/charts/loading?month=${filters.month}&year=${filters.year}`,
          chartType,
        }),
      },
      {
        id: "commodity",
        label: "Commodity",
        accent: "from-cyan-500 to-blue-600",
        Component: CommodityPieChart,
        props: (_, filters) => ({
          apiUrl: `/dashboard/charts/loading?month=${filters.month}&year=${filters.year}`,
        }),
      },
    ],
  },
  {
    title: "Market Dynamics",
    icon: FaGlobeAmericas,
    color: "from-amber-400 to-orange-500",
    glow: "shadow-amber-500/25",
    description: "Sauda, bids & agents",
    cards: [
      {
        id: "sauda",
        label: "Sauda",
        accent: "from-emerald-500 to-green-600",
        Component: SaudaChart,
        props: (chartType, filters) => ({
          apiUrl: `/dashboard/charts/sauda?month=${filters.month}&year=${filters.year}`,
          chartType,
        }),
      },
      {
        id: "bids",
        label: "Bids",
        accent: "from-amber-500 to-orange-600",
        Component: BidChart,
        props: (chartType, filters) => ({
          apiUrl: `/dashboard/charts/bids?month=${filters.month}&year=${filters.year}`,
          chartType,
        }),
      },
      {
        id: "agent",
        label: "Agents",
        accent: "from-indigo-500 to-violet-600",
        Component: AgentSaudaChart,
        props: (chartType, filters) => ({
          apiUrl: `/dashboard/charts/agent-distribution?month=${filters.month}&year=${filters.year}`,
          chartType,
        }),
      },
    ],
  },
];

const ChartCard = memo(({ featured, label, accent, children }) => (
  <article
    className={[
      "mi-card-3d relative min-w-0 flex flex-col overflow-hidden",
      "rounded-2xl sm:rounded-3xl lg:rounded-[2rem]",
      "border border-white/60",
      "bg-white/70 backdrop-blur-xl",
      "shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)]",
      "p-4 sm:p-6 lg:p-8",
      featured ? "md:col-span-2" : "",
    ].join(" ")}
    style={{
      boxShadow:
        "0 24px 48px -20px rgba(79,70,229,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
    }}
  >
    <div
      className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r ${accent}`}
      aria-hidden
    />
    {label && (
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </span>
        {featured && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
            <FaBolt className="text-[7px]" aria-hidden />
            Featured
          </span>
        )}
      </div>
    )}
    <div className="relative z-[1] min-w-0 flex-1 -mx-1 sm:mx-0">{children}</div>
    <div
      className={`pointer-events-none absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br ${accent} opacity-[0.07]`}
      aria-hidden
    />
  </article>
));

ChartCard.displayName = "ChartCard";

const ChartSection = memo(() => {
  const [chartType, setChartType] = useState("line");
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear; y >= 2024; y--) list.push(y);
    return list;
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <section className="mi-perspective w-full min-w-0 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* Ambient mesh */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-[2rem]">
          <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-indigo-300/15 blur-[100px] rounded-full mi-float-orb" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[35%] bg-cyan-300/10 blur-[90px] rounded-full mi-float-orb" style={{ animationDelay: "2s" }} />
        </div>

        {/* Header — mobile stack, desktop row */}
        <header
          className="relative mi-header-float overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] border border-white/50 p-4 sm:p-6 lg:p-8 mi-shine"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(238,242,255,0.85) 50%, rgba(255,255,255,0.9) 100%)",
            boxShadow:
              "0 24px 48px -16px rgba(79,70,229,0.2), inset 0 1px 0 rgba(255,255,255,1)",
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
              <div
                className="shrink-0 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-white shadow-xl"
                style={{
                  background:
                    "linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)",
                  boxShadow: "0 16px 40px -8px rgba(79,70,229,0.55)",
                  transform: "translateZ(24px)",
                }}
              >
                <FaGlobeAmericas className="text-xl sm:text-2xl" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                  Market{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500">
                    Intelligence
                  </span>
                </h2>
                <SariaAiBrand
                  size="sm"
                  subtitle="Powered by saria.ai · real-time charts"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-1 xs:flex-none min-w-0 p-1.5 rounded-xl sm:rounded-2xl bg-white/90 border border-slate-200/80 shadow-inner">
                <FaCalendarAlt className="text-slate-400 shrink-0 ml-2" size={12} />
                <select
                  value={filters.month}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      month: parseInt(e.target.value, 10),
                    }))
                  }
                  className="flex-1 min-w-0 bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider py-2.5 focus:ring-0 cursor-pointer"
                  aria-label="Month"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="w-px h-5 bg-slate-200 shrink-0" />
                <select
                  value={filters.year}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value, 10),
                    }))
                  }
                  className="bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider py-2.5 px-2 focus:ring-0 cursor-pointer"
                  aria-label="Year"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="flex items-center justify-center gap-1 p-1.5 rounded-xl sm:rounded-2xl shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, #0f172a, #1e1b4b)",
                  boxShadow: "0 8px 24px -6px rgba(15,23,42,0.4)",
                }}
                role="group"
                aria-label="Chart type"
              >
                {[
                  { id: "line", icon: FaChartLine, label: "Line" },
                  { id: "bar", icon: FaChartBar, label: "Bar" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setChartType(type.id)}
                    aria-pressed={chartType === type.id}
                    aria-label={type.label}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      chartType === type.id
                        ? "bg-white text-indigo-600 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <type.icon size={14} />
                    <span className="hidden sm:inline">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="animate-fade-in-up">
          <AIInsights month={filters.month} year={filters.year} />
        </div>

        <div className="space-y-10 sm:space-y-14 lg:space-y-20 pb-8 sm:pb-16">
          {CHART_PARTS.map((part, pIdx) => (
            <div
              key={part.title}
              className="space-y-5 sm:space-y-8 animate-fade-in-up min-w-0"
              style={{ animationDelay: `${pIdx * 120}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-5 sm:pb-6">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div
                    className={`shrink-0 p-3.5 sm:p-4 bg-gradient-to-br ${part.color} rounded-2xl sm:rounded-3xl text-white shadow-xl ${part.glow}`}
                    style={{ transform: "rotate(-4deg) translateZ(8px)" }}
                  >
                    <part.icon size={22} className="sm:w-7 sm:h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none truncate">
                      {part.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-[0.15em]">
                      {part.description}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-900/5 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  saria.ai · v3
                </span>
              </div>

              <div
                className={`grid gap-4 sm:gap-6 lg:gap-8 min-w-0 ${
                  part.cards.length === 1
                    ? "grid-cols-1"
                    : part.cards.length === 2
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                }`}
              >
                {part.cards.map((card) => (
                  <ChartCard
                    key={card.id}
                    featured={card.featured}
                    label={card.label}
                    accent={card.accent}
                  >
                    <card.Component {...card.props(chartType, filters)} />
                  </ChartCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Suspense>
  );
});

ChartSection.displayName = "ChartSection";

export default ChartSection;
