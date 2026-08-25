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
            <label className="block text-sm font-medium mb-1">{label}</label>
            {type === "date" ? (
              <DateSelector
                selectedDate={state[field] || getCurrentDate()}
                onChange={(date) => handleChange(field, date)}
              />
            ) : type === "finance" ? (
              <select
                value={state[field] || "no"}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
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
                      ? "bg-green-500 text-white shadow-lg shadow-green-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleChange(field, "closed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    state[field] === "closed"
                      ? "bg-red-500 text-white shadow-lg shadow-red-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
