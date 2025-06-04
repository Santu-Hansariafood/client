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
        <div className="inline-flex rounded-2xl shadow-lg bg-gradient-to-r from-blue-200 via-white to-purple-200 p-2 gap-2">
          <button
            className={`px-6 py-2 rounded-xl font-bold shadow transition-all border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              chartType === "line"
                ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white scale-105"
                : "bg-white/70 text-blue-700 hover:bg-blue-100"
            }`}
            onClick={() => setChartType("line")}
          >
            Line Chart
          </button>
          <button
            className={`px-6 py-2 rounded-xl font-bold shadow transition-all border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-pink-400 ${
              chartType === "bar"
                ? "bg-gradient-to-r from-pink-400 to-yellow-400 text-white scale-105"
                : "bg-white/70 text-pink-700 hover:bg-pink-100"
            }`}
            onClick={() => setChartType("bar")}
          >
            Bar Chart
          </button>
        </div>
      </div>
      <div className="space-y-10">
        <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-blue-100 via-white/80 to-purple-100 backdrop-blur-2xl border border-blue-200 p-8">
          <SaudaChart apiUrl="https://api.hansariafood.shop/api/self-order" chartType={chartType} />
        </div>
        <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-yellow-100 via-white/80 to-pink-100 backdrop-blur-2xl border border-yellow-200 p-8">
          <BidChart apiUrl="https://api.hansariafood.shop/api/bids" chartType={chartType} />
        </div>
      </div>
    </Suspense>
  );
};

export default ChartSection;
