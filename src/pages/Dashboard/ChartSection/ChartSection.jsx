import { useState } from "react";
import { lazy, Suspense } from "react";

const SaudaChart = lazy(() =>
  import("../../../common/Charts/SaudaChart/SaudaChart")
);
const BidChart = lazy(() => import("../../../common/Charts/BidChart/BidChart"));
import Loading from "../../../common/Loading/Loading";

const ChartSection = () => {
  const [chartType, setChartType] = useState("line");

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-sm gap-1">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8CC63F] focus-visible:ring-offset-2 ${
              chartType === "line"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setChartType("line")}
          >
            Line Chart
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2 ${
              chartType === "bar"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setChartType("bar")}
          >
            Bar Chart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <SaudaChart apiUrl="/self-order" chartType={chartType} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <BidChart apiUrl="/bids" chartType={chartType} />
        </div>
      </div>
    </Suspense>
  );
};

export default ChartSection;
