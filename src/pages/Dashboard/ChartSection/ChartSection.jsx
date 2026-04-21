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
import Loading from "../../../common/Loading/Loading";

const ChartSection = ({ agentSaudas }) => {
  const [chartType, setChartType] = useState("line");

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Trend View
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Toggle between line and bar for clearer comparisons.
            </p>
          </div>

          <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200 shadow-sm gap-1">
            <button
              type="button"
              aria-pressed={chartType === "line"}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 ${
                chartType === "line"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setChartType("line")}
            >
              <span className="inline-flex items-center gap-2">
                <FaChartLine />
                Line
              </span>
            </button>
            <button
              type="button"
              aria-pressed={chartType === "bar"}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 ${
                chartType === "bar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setChartType("bar")}
            >
              <span className="inline-flex items-center gap-2">
                <FaChartBar />
                Bar
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <SaudaChart apiUrl="/self-order" chartType={chartType} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <AgentSaudaChart data={agentSaudas || []} chartType={chartType} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <BidChart apiUrl="/bids" chartType={chartType} />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default ChartSection;
