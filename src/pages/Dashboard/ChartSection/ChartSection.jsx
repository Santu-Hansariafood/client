import SaudaChart from "../../../common/Charts/SaudaChart/SaudaChart";
import BidChart from "../../../common/Charts/BidChart/BidChart";

const ChartSection = () => {
  return (
    <>
      <div className="mt-8">
        <SaudaChart apiUrl="https://phpserver-v77g.onrender.com/api/self-order" />
      </div>
      <div className="mt-8">
        <BidChart apiUrl="https://phpserver-v77g.onrender.com/api/bids" />
      </div>
    </>
  );
};

export default ChartSection;
