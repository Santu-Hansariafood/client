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
  () => import("../../../common/Charts/PaymentAnalyticsChart/PaymentAnalyticsChart"),
);
const CommodityPieChart = lazy(
  () => import("../../../common/Charts/CommodityPieChart/CommodityPieChart"),
);

const ChartSection = memo(({ agentSaudas = [] }) => {
  const [chartType, setChartType] = useState("line");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'line'

  const toggleChartType = (type) => setChartType(type);
  const toggleViewMode = (mode) => setViewMode(mode);

  const containerClasses = `rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-10 hover:border-indigo-100 transition-all duration-500 group overflow-hidden`;

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <FaChartLine
                  className="text-white text-lg"
                  aria-hidden="true"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Operational Intelligence
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Real-time performance metrics and market trends
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div
              className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner gap-1"
              role="group"
              aria-label="Toggle chart type"
            >
              <button
                type="button"
                onClick={() => toggleChartType("line")}
                aria-pressed={chartType === "line"}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 uppercase tracking-widest flex items-center gap-2 ${
                  chartType === "line"
                    ? "bg-white text-indigo-600 shadow-lg scale-105"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                <FaChartLine aria-hidden="true" />
                Trend
              </button>
              <button
                type="button"
                onClick={() => toggleChartType("bar")}
                aria-pressed={chartType === "bar"}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 uppercase tracking-widest flex items-center gap-2 ${
                  chartType === "bar"
                    ? "bg-white text-indigo-600 shadow-lg scale-105"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                <FaChartBar aria-hidden="true" />
                Volume
              </button>
            </div>

            <div
              className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner gap-1"
              role="group"
              aria-label="Toggle layout view"
            >
              <button
                type="button"
                onClick={() => toggleViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Grid view"
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-lg scale-110"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                <FaThLarge size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => toggleViewMode("line")}
                aria-pressed={viewMode === "line"}
                aria-label="List view"
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  viewMode === "line"
                    ? "bg-white text-indigo-600 shadow-lg scale-110"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                <FaStream size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`grid gap-8 transition-all duration-500 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
        >
          <div className={`${containerClasses} lg:col-span-2`}>
            <PaymentAnalyticsChart chartType={chartType} />
          </div>

          <div className={containerClasses}>
            <LoadingChart apiUrl="/loading-entries" chartType={chartType} />
          </div>

          <div className={containerClasses}>
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
