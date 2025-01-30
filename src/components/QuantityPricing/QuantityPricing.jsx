import { useState, useMemo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Loading from "../../common/Loading/Loading";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));

const QuantityPricing = ({ handleChange }) => {
  const [formData, setFormData] = useState({
    quantity: "",
    pendingQuantity: "",
    rate: "",
    gst: "",
    cd: "",
    weight: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    if (handleChange) {
      handleChange(field, value);
    }
  };

  const inputFields = useMemo(
    () => [
      {
        label: "Quantity",
        field: "quantity",
        placeholder: "Quantity",
        type: "number",
      },
      {
        label: "Pending Quantity",
        field: "pendingQuantity",
        placeholder: "Pending Quantity",
        type: "number",
      },
      {
        label: "Rate (in tons)",
        field: "rate",
        placeholder: "Rate (in tons)",
        type: "number",
      },
      { label: "GST (%)", field: "gst", placeholder: "GST", type: "number" },
      { label: "CD (%)", field: "cd", placeholder: "CD (%)", type: "number" },
      { label: "Weight", field: "weight", placeholder: "Weight", type: "text" },
    ],
    []
  );

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Quantity and Pricing
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inputFields.map(({ label, field, placeholder, type }) => (
          <div key={field}>
            <label className="block text-sm text-gray-600 mb-1">{label}</label>
            <DataInput
              placeholder={placeholder}
              inputType={type}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>
    </Suspense>
  );
};

QuantityPricing.propTypes = {
  handleChange: PropTypes.func.isRequired,
};

export default QuantityPricing;
