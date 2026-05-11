import { useState } from "react";
import { lazy, Suspense } from "react";
import { FaChartLine, FaChartBar } from "react-icons/fa";

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
const CommodityPieChart = lazy(
  () => import("../../../common/Charts/CommodityPieChart/CommodityPieChart"),
);
import Loading from "../../../common/Loading/Loading";

const ChartSection = ({ agentSaudas }) => {
  const [chartType, setChartType] = useState("line");

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-slate-100 pb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Operational Intelligence
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Real-time performance metrics and market trends
            </p>
          </div>

          <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner gap-1">
            <button
              type="button"
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                chartType === "line"
                  ? "bg-white text-slate-900 shadow-xl scale-105"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setChartType("line")}
            >
              <span className="inline-flex items-center gap-2">
                <FaChartLine />
                Trend
              </span>
            </button>
            <button
              type="button"
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                chartType === "bar"
                  ? "bg-white text-slate-900 shadow-xl scale-105"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setChartType("bar")}
            >
              <span className="inline-flex items-center gap-2">
                <FaChartBar />
                Volume
              </span>
            </button>
          </div>
        </div>

        {/* Sequential Layout */}
        <div className="space-y-10">
          {/* Top Row: Main Trends */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-blue-200 transition-colors duration-500">
              <LoadingChart apiUrl="/loading-entries" chartType={chartType} />
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-emerald-200 transition-colors duration-500">
              <CommodityPieChart apiUrl="/loading-entries" />
            </div>
          </div>

          {/* Middle Row: Sauda & Bids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-amber-200 transition-colors duration-500">
              <SaudaChart apiUrl="/self-order" chartType={chartType} />
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-purple-200 transition-colors duration-500">
              <BidChart apiUrl="/bids" chartType={chartType} />
            </div>
          </div>

          {/* Bottom Row: Agent Performance */}
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-indigo-200 transition-colors duration-500">
            <AgentSaudaChart data={agentSaudas || []} chartType={chartType} />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default ChartSection;
