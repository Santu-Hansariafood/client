import { useState, useEffect, useRef, lazy, Suspense, memo } from "react";
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
    accent: "from-lux-emerald to-[#0f8a6c]",
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
    accent: "from-lux-emerald to-[#12a594]",
    Component: PaymentAnalyticsChart,
    props: (chartType) => ({ chartType }),
  },
  {
    id: "loading",
    label: "Loading",
    accent: "from-[#0d7a68] to-[#12a594]",
    Component: LoadingChart,
    props: (chartType) => ({ apiUrl: "/loading-entries", chartType }),
  },
  {
    id: "commodity",
    label: "Commodity",
    accent: "from-lux-emerald to-[#12a594]",
    parallax: true,
    Component: CommodityPieChart,
    props: () => ({ apiUrl: "/loading-entries" }),
  },
  {
    id: "sauda",
    label: "Sauda",
    accent: "from-lux-emerald to-[#0f8a6c]",
    parallax: true,
    Component: SaudaChart,
    props: (chartType) => ({ apiUrl: "/self-order", chartType }),
  },
  {
    id: "sauda-pie",
    label: "Sauda mix",
    accent: "from-lux-emerald to-[#0f8a6c]",
    parallax: true,
    Component: SaudaChart,
    props: () => ({ apiUrl: "/self-order", chartType: "pie" }),
  },
  {
    id: "bids",
    label: "Bids",
    accent: "from-lux-gold to-[#b8860b]",
    parallax: true,
    Component: BidChart,
    props: (chartType) => ({ apiUrl: "/bids", chartType }),
  },
  {
    id: "bids-pie",
    label: "Bid mix",
    accent: "from-lux-gold to-[#b8860b]",
    parallax: true,
    Component: BidChart,
    props: () => ({ apiUrl: "/bids", chartType: "pie" }),
  },
  {
    id: "agent",
    label: "Agents",
    accent: "from-lux-night to-lux-deep",
    parallax: true,
    Component: AgentSaudaChart,
    props: (chartType, agentSaudas) => ({ data: agentSaudas, chartType }),
  },
  {
    id: "agent-pie",
    label: "Agent mix",
    accent: "from-lux-night to-lux-deep",
    parallax: true,
    Component: AgentSaudaChart,
    props: (_, agentSaudas) => ({ data: agentSaudas, chartType: "pie" }),
  },
];

const ChartCard = memo(({ featured, label, accent, parallax, children }) => (
  <article
    data-market-parallax={parallax ? "" : undefined}
    className={[
      "lux-card lux-gold-top relative min-w-0 flex flex-col overflow-hidden",
      "rounded-2xl sm:rounded-[1.75rem] lg:rounded-[2rem]",
      "p-4 sm:p-6 lg:p-8",
      "transition-all duration-500 ease-out",
      "hover:border-[#dccfa8] hover:shadow-[0_30px_64px_-34px_rgba(6,95,70,0.5)]",
      "group",
      featured ? "lg:col-span-2" : "",
      parallax ? "market-parallax-card" : "",
    ].join(" ")}
  >
    {label && (
      <span className="sr-only">{label} chart</span>
    )}
    {featured && (
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lux-gold/40 bg-lux-cream px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-lux-emerald sm:text-[10px]">
          <FaBolt className="text-[8px] text-lux-gold" aria-hidden />
          Primary
        </span>
      </div>
    )}
    <div className="relative z-[1] min-w-0 flex-1">{children}</div>
    <div
      className={`pointer-events-none absolute -bottom-8 -right-8 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br ${accent} opacity-[0.06] group-hover:scale-125 transition-transform duration-700`}
      aria-hidden
    />
  </article>
));

ChartCard.displayName = "ChartCard";

const ChartSection = memo(({ agentSaudas = [], dateWiseWorks = [], employeeWiseWorks = [] }) => {
  const [chartType, setChartType] = useState("line");
  const [viewMode, setViewMode] = useState("grid");
  const chartGridRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return undefined;

    let frameId;
    const updateParallax = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight / 2;
        chartGridRef.current
          ?.querySelectorAll("[data-market-parallax]")
          .forEach((card) => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const progress = Math.max(
              -1,
              Math.min(1, (cardCenter - viewportCenter) / viewportCenter),
            );
            card.style.setProperty("--market-parallax-y", `${progress * -12}px`);
            card.style.setProperty("--market-parallax-tilt", `${progress * -2}deg`);
            card.style.setProperty(
              "--market-parallax-scale",
              `${1 - Math.abs(progress) * 0.006}`,
            );
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
  }, [viewMode]);

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
              <div className="shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40 sm:h-12 sm:w-12">
                  <FaChartLine
                    className="text-lg sm:text-xl"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="lux-eyebrow mb-1">Live analytics</p>
                <h2
                  id="market-intelligence-heading"
                  className="font-serif text-xl font-semibold tracking-tight text-lux-ink sm:text-2xl md:text-3xl"
                >
                  Market{" "}
                  <span className="bg-gradient-to-r from-lux-emerald to-lux-gold bg-clip-text text-transparent">
                    Intelligence
                  </span>
                </h2>
                <div className="mt-2 h-1 w-10 rounded-full bg-gradient-to-r from-lux-emerald to-lux-gold sm:w-12" />
                <p className="mt-2 max-w-xl text-xs font-medium text-lux-muted sm:text-sm">
                  Real-time operational performance across payments, loading,
                  sauda, and bids
                </p>
              </div>
            </div>

            {/* Controls — full width on mobile */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 w-full">
              <div
                className="grid grid-cols-2 gap-1.5 sm:inline-flex sm:gap-0 rounded-xl sm:rounded-2xl bg-[#f2eee2] backdrop-blur-md p-1 sm:p-1.5 border border-[#e6dcc4] shadow-inner w-full sm:w-auto"
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
                    className={`justify-center px-3 sm:px-5 py-2.5 rounded-lg sm:rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest flex items-center gap-2 ${
                      chartType === type.id
                        ? "bg-white text-lux-emerald shadow-md ring-1 ring-lux-gold/30"
                        : "text-lux-muted hover:text-lux-emerald hover:bg-white/60"
                    }`}
                  >
                    <type.icon size={12} aria-hidden />
                    {type.label}
                  </button>
                ))}
              </div>

              <div
                className="flex rounded-xl sm:rounded-2xl bg-lux-night/95 p-1 sm:p-1.5 shadow-lg border border-lux-gold/20 w-full sm:w-auto"
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
                        ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-md ring-1 ring-lux-gold/30"
                        : "text-white/50 hover:text-lux-gold-soft"
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
          ref={chartGridRef}
          className={[
            "grid w-full min-w-0 transition-all duration-500",
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
              : "grid-cols-1 gap-4 sm:gap-6",
          ].join(" ")}
        >
          {CHART_CARDS.map(
            ({ id, featured, label, accent, parallax, Component, props }) => (
              <ChartCard
                key={id}
                featured={featured && viewMode === "grid"}
                label={label}
                accent={accent}
                parallax={parallax}
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
