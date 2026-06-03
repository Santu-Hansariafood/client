import { useState, lazy, Suspense, memo, useMemo } from "react";
import {
  FaChartLine,
  FaChartBar,
  FaThLarge,
  FaStream,
  FaBolt,
  FaCalendarAlt,
  FaRobot,
  FaWallet,
  FaTruckLoading,
  FaGlobeAmericas,
} from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
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

const CHART_PARTS = [
  {
    title: "Financial Intelligence",
    icon: FaWallet,
    color: "from-emerald-400 to-teal-500",
    description: "Revenue flow and payment analytics",
    cards: [
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
      }
    ]
  },
  {
    title: "Logistics & Operations",
    icon: FaTruckLoading,
    color: "from-blue-400 to-indigo-500",
    description: "Distribution and loading metrics",
    cards: [
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
      }
    ]
  },
  {
    title: "Market Dynamics",
    icon: FaGlobeAmericas,
    color: "from-amber-400 to-orange-500",
    description: "Bidding and sauda performance",
    cards: [
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
        id: "agent",
        label: "Agents",
        accent: "from-indigo-500 to-violet-600",
        ring: "ring-indigo-100/80",
        Component: AgentSaudaChart,
        props: (chartType, filters) => ({ 
          apiUrl: `/dashboard/charts/agent-distribution?month=${filters.month}&year=${filters.year}`, 
          chartType 
        }),
      }
    ]
  }
];

const ChartCard = memo(({ featured, label, accent, ring, children }) => (
  <article
    className={[
      "relative min-w-0 flex flex-col",
      "rounded-[2.5rem]",
      "border border-white/20 bg-white/40 backdrop-blur-2xl",
      "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]",
      "p-6 sm:p-8",
      "transition-all duration-700 ease-out",
      "hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.15)] hover:border-indigo-200/60 hover:-translate-y-2",
      "group overflow-hidden",
      featured ? "lg:col-span-2" : "",
      ring,
      "ring-1",
    ].join(" ")}
  >
    <div
      className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      aria-hidden
    />
    {label && (
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">
          {label} Analytics
        </span>
        {featured && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">
            <FaBolt className="text-[8px] animate-pulse" aria-hidden />
            Featured Intelligence
          </span>
        )}
      </div>
    )}
    <div className="relative z-[1] min-w-0 flex-1">{children}</div>
    <div
      className={`pointer-events-none absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${accent} opacity-[0.05] group-hover:scale-150 group-hover:opacity-[0.1] transition-all duration-1000`}
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
    const startYear = 2024;
    const yearList = [];
    for (let y = currentYear; y >= startYear; y--) {
      yearList.push(y);
    }
    return yearList;
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <section className="w-full space-y-12 lg:space-y-20">
        {/* Futuristic Filter Bar */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-900/5 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] border border-white/40 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-2xl shadow-indigo-500/30 transform group-hover:rotate-12 transition-transform duration-500">
                <FaRobot className="text-white text-2xl" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Market <span className="text-indigo-600">Intelligence</span>
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Powered by Seria.ai Core</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 p-1.5 bg-white/80 rounded-2xl shadow-inner border border-slate-200/60">
              <select
                value={filters.month}
                onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="bg-transparent border-none focus:ring-0 text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer px-4 py-2"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="w-px h-4 bg-slate-200" />
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="bg-transparent border-none focus:ring-0 text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer px-4 py-2"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-2xl shadow-2xl border border-white/10">
              {[
                { id: "line", icon: FaChartLine },
                { id: "bar", icon: FaChartBar },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={`p-2.5 rounded-xl transition-all duration-500 ${
                    chartType === type.id 
                      ? "bg-white text-indigo-600 shadow-lg scale-110" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <type.icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* AI Insights Panel - Featured Part */}
        <div className="animate-fade-in-up">
          <AIInsights month={filters.month} year={filters.year} />
        </div>

        {/* Dynamic Content Parts */}
        <div className="space-y-16 lg:space-y-24 pb-20">
          {CHART_PARTS.map((part, pIdx) => (
            <div key={pIdx} className="space-y-8 animate-fade-in-up" style={{ animationDelay: `${pIdx * 200}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="flex items-center gap-6">
                  <div className={`p-5 bg-gradient-to-br ${part.color} rounded-3xl shadow-2xl text-white transform -rotate-3 hover:rotate-0 transition-transform duration-500`}>
                    <part.icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{part.title}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">{part.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="px-5 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Sector Analysis V2.4
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                {part.cards.map((card) => (
                  <ChartCard
                    key={card.id}
                    featured={card.featured}
                    label={card.label}
                    accent={card.accent}
                    ring={card.ring}
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
