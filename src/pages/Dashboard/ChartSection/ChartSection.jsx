import { lazy, Suspense } from "react";

const SaudaChart = lazy(() =>
  import("../../../common/Charts/SaudaChart/SaudaChart")
);
const BidChart = lazy(() => import("../../../common/Charts/BidChart/BidChart"));
import Loading from "../../../common/Loading/Loading";

const ChartSection = () => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="mt-8">
        <SaudaChart apiUrl="https://phpserver-v77g.onrender.com/api/self-order" />
      </div>
      <div className="mt-8">
        <BidChart apiUrl="https://phpserver-v77g.onrender.com/api/bids" />
      </div>
    </Suspense>
  );
};

export default ChartSection;
