import { lazy, Suspense } from "react";
import Loading from "../../common/Loading/Loading";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../common/DateSelector/DateSelector"),
);

const PODetails = ({ handleChange, formData }) => {
  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-serif font-semibold text-lux-ink">
        Purchase Order Details
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-lux-muted mb-1">
            Buyers PO Number{" "}
            <span className="text-lux-muted/70 font-normal">(Optional)</span>
          </label>
          <DataInput
            placeholder="Enter PO Number (optional)"
            value={formData.poNumber || ""}
            onChange={(e) => handleChange("poNumber", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-lux-muted mb-1">
            PO Date
          </label>
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
