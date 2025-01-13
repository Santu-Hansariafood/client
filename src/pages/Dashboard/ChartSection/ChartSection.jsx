import SaudaChart from "../../../common/Charts/SaudaChart/SaudaChart";
import BidChart from "../../../common/Charts/BidChart/BidChart";

const ChartSection = () => {
  return (
    <>
      <div className="mt-8">
        <SaudaChart apiUrl="http://localhost:5000/api/self-order" />
      </div>
      <div className="mt-8">
        <BidChart apiUrl="http://localhost:5000/api/bids" />
      </div>
    </>
  );
};

export default ChartSection;
