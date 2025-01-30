import { lazy, Suspense } from "react";
import Loading from "../../common/Loading/Loading";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DateSelector = lazy(() =>
  import("../../common/DateSelector/DateSelector")
);

const PODetails = ({ handleChange, formData }) => {
  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Purchase Order Details
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Buyers PO Number
          </label>
          <DataInput
            placeholder="PO Number"
            value={formData.poNumber}
            onChange={(e) => handleChange("poNumber", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">PO Date</label>
          <DateSelector
            selectedDate={formData.poDate}
            onChange={(date) => handleChange("poDate", date)}
          />
        </div>
      </div>
    </Suspense>
  );
};

export default PODetails;
