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
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                <FaChartLine className="text-white text-lg" />
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

          <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner gap-1">
            <button
              type="button"
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                chartType === "line"
                  ? "bg-white text-indigo-600 shadow-xl scale-105"
                  : "text-slate-500 hover:text-indigo-600"
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
                  ? "bg-white text-indigo-600 shadow-xl scale-105"
                  : "text-slate-500 hover:text-indigo-600"
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

        {/* Zigzag Layout */}
        <div className="space-y-12">
          {/* Row 1: Loading & Commodity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-blue-200 transition-all duration-500 hover:shadow-blue-100/50">
              <LoadingChart apiUrl="/loading-entries" chartType={chartType} />
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-emerald-200 transition-all duration-500 hover:shadow-emerald-100/50">
              <CommodityPieChart apiUrl="/loading-entries" />
            </div>
          </div>

          {/* Row 2: Sauda (Zigzag - Pie first) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-emerald-200 transition-all duration-500 hover:shadow-emerald-100/50 lg:order-1">
              <SaudaChart apiUrl="/self-order" chartType="pie" />
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-amber-200 transition-all duration-500 hover:shadow-amber-100/50 lg:order-2">
              <SaudaChart apiUrl="/self-order" chartType={chartType} />
            </div>
          </div>

          {/* Row 3: Bids (Zigzag - Trend first) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-purple-200 transition-all duration-500 hover:shadow-purple-100/50">
              <BidChart apiUrl="/bids" chartType={chartType} />
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-fuchsia-200 transition-all duration-500 hover:shadow-fuchsia-100/50">
              <BidChart apiUrl="/bids" chartType="pie" />
            </div>
          </div>

          {/* Row 4: Agents (Zigzag - Pie first) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-indigo-200 transition-all duration-500 hover:shadow-indigo-100/50 lg:order-1">
              <AgentSaudaChart data={agentSaudas || []} chartType="pie" />
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/20 p-6 sm:p-8 hover:border-blue-200 transition-all duration-500 hover:shadow-blue-100/50 lg:order-2">
              <AgentSaudaChart data={agentSaudas || []} chartType={chartType} />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default ChartSection;
