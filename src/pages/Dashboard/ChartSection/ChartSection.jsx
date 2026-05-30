import { useState, lazy, Suspense, memo } from "react";
import { FaChartLine, FaChartBar, FaThLarge, FaStream } from "react-icons/fa";
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

const ChartSection = memo(({ agentSaudas = [] }) => {
  const [chartType, setChartType] = useState("line");
  const [viewMode, setViewMode] = useState("grid");

  const toggleChartType = (type) => setChartType(type);
  const toggleViewMode = (mode) => setViewMode(mode);

  const containerClasses = `relative rounded-[2rem] border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:border-indigo-200/50 transition-all duration-700 group overflow-hidden`;

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pb-10">
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl shadow-indigo-200/50 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <FaChartLine
                    className="text-white text-xl"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  Market <span className="text-indigo-600">Intelligence</span>
                </h2>
                <div className="h-1 w-12 bg-indigo-600 rounded-full mt-2"></div>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              Visualizing Real-time Operational Performance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div
              className="inline-flex rounded-2xl bg-slate-100/80 backdrop-blur-md p-1.5 border border-slate-200 shadow-inner"
              role="group"
            >
              {[
                { id: "line", label: "Trends", icon: FaChartLine },
                { id: "bar", label: "Volumes", icon: FaChartBar }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleChartType(type.id)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all duration-500 uppercase tracking-widest flex items-center gap-2.5 ${
                    chartType === type.id
                      ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-100 ring-1 ring-slate-100"
                      : "text-slate-400 hover:text-indigo-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                  }`}
                >
                  <type.icon size={12} />
                  {type.label}
                </button>
              ))}
            </div>

            <div
              className="inline-flex rounded-2xl bg-slate-800 p-1.5 shadow-xl shadow-slate-200/50 border border-slate-700"
              role="group"
            >
              {[
                { id: "grid", icon: FaThLarge },
                { id: "line", icon: FaStream }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => toggleViewMode(mode.id)}
                  className={`p-2.5 rounded-xl transition-all duration-500 ${
                    viewMode === mode.id
                      ? "bg-indigo-500 text-white shadow-lg scale-105"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <mode.icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`grid gap-10 transition-all duration-700 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
        >
          <div className={`${containerClasses} lg:col-span-2 ring-1 ring-indigo-50/50`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
              <FaChartLine size={120} />
            </div>
            <PaymentAnalyticsChart chartType={chartType} />
          </div>

          <div className={containerClasses}>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000"></div>
            <LoadingChart apiUrl="/loading-entries" chartType={chartType} />
          </div>

          <div className={containerClasses}>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000"></div>
            <CommodityPieChart apiUrl="/loading-entries" />
          </div>

          <div className={containerClasses}>
            <SaudaChart apiUrl="/self-order" chartType={chartType} />
          </div>

          <div className={containerClasses}>
            <SaudaChart apiUrl="/self-order" chartType="pie" />
          </div>

          <div className={containerClasses}>
            <BidChart apiUrl="/bids" chartType={chartType} />
          </div>

          <div className={containerClasses}>
            <BidChart apiUrl="/bids" chartType="pie" />
          </div>

          <div className={containerClasses}>
            <AgentSaudaChart data={agentSaudas} chartType={chartType} />
          </div>

          <div className={containerClasses}>
            <AgentSaudaChart data={agentSaudas} chartType="pie" />
          </div>
        </div>
      </div>
    </Suspense>
  );
});

ChartSection.displayName = "ChartSection";

export default ChartSection;
