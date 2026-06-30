import { useState, lazy, Suspense, memo } from "react";
import {
  FaChartLine,
  FaChartBar,
  FaThLarge,
  FaStream,
  FaBolt,
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
const EmployeeWorkChart = lazy(
  () => import("../../../common/Charts/EmployeeWorkChart/EmployeeWorkChart"),
);

const CHART_CARDS = [
  {
    id: "employee-work",
    featured: true,
    label: "Employee Work",
    accent: "from-indigo-500 to-purple-600",
    ring: "ring-indigo-100/80",
    Component: EmployeeWorkChart,
    props: (chartType, agentSaudas, dateWiseWorks, employeeWiseWorks) => ({ 
      chartType, 
      dateWiseData: dateWiseWorks, 
      employeeWiseData: employeeWiseWorks 
    }),
  },
  {
    id: "payment",
    featured: true,
    label: "Payments",
    accent: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-100/80",
    Component: PaymentAnalyticsChart,
    props: (chartType) => ({ chartType }),
  },
  {
    id: "loading",
    label: "Loading",
    accent: "from-blue-500 to-indigo-600",
    ring: "ring-blue-100/80",
    Component: LoadingChart,
    props: (chartType) => ({ apiUrl: "/loading-entries", chartType }),
  },
  {
    id: "commodity",
    label: "Commodity",
    accent: "from-emerald-500 to-cyan-600",
    ring: "ring-emerald-100/80",
    Component: CommodityPieChart,
    props: () => ({ apiUrl: "/loading-entries" }),
  },
  {
    id: "sauda",
    label: "Sauda",
    accent: "from-emerald-500 to-green-600",
    ring: "ring-emerald-100/80",
    Component: SaudaChart,
    props: (chartType) => ({ apiUrl: "/self-order", chartType }),
  },
  {
    id: "sauda-pie",
    label: "Sauda mix",
    accent: "from-emerald-500 to-green-600",
    ring: "ring-emerald-100/80",
    Component: SaudaChart,
    props: () => ({ apiUrl: "/self-order", chartType: "pie" }),
  },
  {
    id: "bids",
    label: "Bids",
    accent: "from-amber-500 to-orange-600",
    ring: "ring-amber-100/80",
    Component: BidChart,
    props: (chartType) => ({ apiUrl: "/bids", chartType }),
  },
  {
    id: "bids-pie",
    label: "Bid mix",
    accent: "from-amber-500 to-orange-600",
    ring: "ring-amber-100/80",
    Component: BidChart,
    props: () => ({ apiUrl: "/bids", chartType: "pie" }),
  },
  {
    id: "agent",
    label: "Agents",
    accent: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-100/80",
    Component: AgentSaudaChart,
    props: (chartType, agentSaudas) => ({ data: agentSaudas, chartType }),
  },
  {
    id: "agent-pie",
    label: "Agent mix",
    accent: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-100/80",
    Component: AgentSaudaChart,
    props: (_, agentSaudas) => ({ data: agentSaudas, chartType: "pie" }),
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

const ChartSection = memo(({ agentSaudas = [], dateWiseWorks = [], employeeWiseWorks = [] }) => {
  const [chartType, setChartType] = useState("line");
  const [viewMode, setViewMode] = useState("grid");

  return (
    <Suspense fallback={<Loading />}>
      <section
        className="w-full min-w-0"
        aria-labelledby="market-intelligence-heading"
      >
        {/* Header + controls */}
        <header className="mb-6 sm:mb-8 lg:mb-10 space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-4 sm:gap-5">
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
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
                  Real-time operational performance across payments, loading,
                  sauda, and bids
                </p>
              </div>
            </div>

            {/* Controls — full width on mobile */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 w-full">
              <div
                className="grid grid-cols-2 gap-1.5 sm:inline-flex sm:gap-0 rounded-xl sm:rounded-2xl bg-slate-100/90 backdrop-blur-md p-1 sm:p-1.5 border border-slate-200/80 shadow-inner w-full sm:w-auto"
                role="group"
                aria-label="Chart visualization type"
              >
                {[
                  { id: "line", label: "Trends", icon: FaChartLine },
                  { id: "bar", label: "Volumes", icon: FaChartBar },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setChartType(type.id)}
                    aria-pressed={chartType === type.id}
                    className={`justify-center px-3 sm:px-5 py-2.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest flex items-center gap-2 ${
                      chartType === type.id
                        ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                    }`}
                  >
                    <type.icon size={12} aria-hidden />
                    {type.label}
                  </button>
                ))}
              </div>

              <div
                className="flex rounded-xl sm:rounded-2xl bg-slate-800/95 p-1 sm:p-1.5 shadow-lg border border-slate-700/80 w-full sm:w-auto"
                role="group"
                aria-label="Dashboard layout"
              >
                {[
                  { id: "grid", label: "Grid", icon: FaThLarge },
                  { id: "line", label: "Stack", icon: FaStream },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    aria-pressed={viewMode === mode.id}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
                      viewMode === mode.id
                        ? "bg-indigo-500 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <mode.icon size={14} aria-hidden />
                    <span className="sm:hidden">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Chart grid */}
        <div
          className={[
            "grid w-full min-w-0 transition-all duration-500",
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
              : "grid-cols-1 gap-4 sm:gap-6",
          ].join(" ")}
        >
          {CHART_CARDS.map(
            ({ id, featured, label, accent, ring, Component, props }) => (
              <ChartCard
                key={id}
                featured={featured && viewMode === "grid"}
                label={label}
                accent={accent}
                ring={ring}
              >
                <Component {...props(chartType, agentSaudas, dateWiseWorks, employeeWiseWorks)} />
              </ChartCard>
            ),
          )}
        </div>
      </section>
    </Suspense>
  );
});

ChartSection.displayName = "ChartSection";

export default ChartSection;
