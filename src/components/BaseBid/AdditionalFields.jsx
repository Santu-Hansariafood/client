import { lazy, Suspense, useEffect } from "react";
import Loading from "../../common/Loading/Loading";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../common/DateSelector/DateSelector"),
);

const AdditionalFields = ({ state, handleChange }) => {
  const getCurrentDate = () => new Date();
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (!state.bidDate) handleChange("bidDate", getCurrentDate());
    if (!state.startTime) handleChange("startTime", getCurrentTime());
  }, []);

  const fields = [
    { label: "Quantity (Tons)", field: "quantity", type: "text" },
    { label: "Rate (Rs.)", field: "rate", type: "text" },
    { label: "Bid Date", field: "bidDate", type: "date" },
    { label: "Start Time", field: "startTime", type: "time" },
    { label: "End Time", field: "endTime", type: "time" },
    { label: "Payment Terms", field: "paymentTerms", type: "text" },
    { label: "Delivery", field: "delivery", type: "text" },
    { label: "Finance Required", field: "financeRequired", type: "finance" },
    { label: "Status", field: "status", type: "toggle" },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        {fields.map(({ label, field, type }, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-lux-muted mb-1">{label}</label>
            {type === "date" ? (
              <DateSelector
                selectedDate={state[field] || getCurrentDate()}
                onChange={(date) => handleChange(field, date)}
              />
            ) : type === "finance" ? (
              <select
                value={state[field] || "no"}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full rounded-xl border border-[#e9e2d3] bg-lux-ivory px-4 py-3 text-sm font-semibold text-lux-ink outline-none focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            ) : type === "toggle" ? (
              <div className="flex items-center gap-4 py-2">
                <button
                  type="button"
                  onClick={() => handleChange(field, "active")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    state[field] === "active"
                      ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/20"
                      : "bg-lux-ivory text-lux-muted hover:bg-[#ece4d2]"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleChange(field, "closed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    state[field] === "closed"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "bg-lux-ivory text-lux-muted hover:bg-[#ece4d2]"
                  }`}
                >
                  Closed
                </button>
              </div>
            ) : (
              <DataInput
                placeholder={label}
                value={
                  state[field] ||
                  (field === "startTime" ? getCurrentTime() : "")
                }
                onChange={(e) => handleChange(field, e.target.value)}
                inputType={type}
              />
            )}
          </div>
        ))}
      </div>
    </Suspense>
  );
};

export default AdditionalFields;
