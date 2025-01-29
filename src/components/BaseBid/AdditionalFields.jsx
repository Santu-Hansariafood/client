import { useEffect } from "react";
import DataInput from "../../common/DataInput/DataInput";
import DateSelector from "../../common/DateSelector/DateSelector";

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
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
      {fields.map(({ label, field, type }, index) => (
        <div key={index}>
          <label className="block text-sm font-medium mb-1">{label}</label>
          {type === "date" ? (
            <DateSelector
              selectedDate={state[field] || getCurrentDate()}
              onChange={(date) => handleChange(field, date)}
            />
          ) : (
            <DataInput
              placeholder={label}
              value={
                state[field] || (field === "startTime" ? getCurrentTime() : "")
              }
              onChange={(e) => handleChange(field, e.target.value)}
              inputType={type}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default AdditionalFields;
