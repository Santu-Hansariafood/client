import { useMemo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Loading from "../../common/Loading/Loading";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DataDropdown = lazy(() => import("../../common/DataDropdown/DataDropdown"));

const QuantityPricing = ({ formData = {}, handleChange }) => {
  const handleInputChange = (field, value) => {
    if (handleChange) handleChange(field, value);
  };

  const gstOptions = useMemo(
    () => [
      { label: "0%", value: 0 },
      { label: "5%", value: 5 },
    ],
    [],
  );

  const weightOptions = useMemo(() => {
    const options = [
      { label: "Delivery", value: "Delivery" },
      { label: "Loading", value: "Loading" },
    ];
    const currentWeight =
      formData.weight == null ? "" : String(formData.weight);

    if (
      currentWeight &&
      !options.some((option) => option.value === currentWeight)
    ) {
      options.push({ label: currentWeight, value: currentWeight });
    }

    return options;
  }, [formData.weight]);

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
        label: "Rate (per Ton)",
        field: "rate",
        placeholder: "Rate (per Ton)",
        type: "number",
      },
      {
        label: "CD (%)",
        field: "cd",
        placeholder: "CD (%)",
        type: "number",
      },
    ],
    [],
  );

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold font-serif text-lux-ink">
        Quantity and Pricing
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inputFields.map(({ label, field, placeholder, type }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-lux-muted mb-1">
              {label}
            </label>
            <DataInput
              placeholder={placeholder}
              inputType={type}
              value={formData[field] ?? ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-lux-muted mb-1">
            Weight (Tons)
          </label>
          <DataDropdown
            options={weightOptions}
            selectedOptions={
              formData.weight == null ? "" : String(formData.weight)
            }
            onChange={(selected) =>
              handleInputChange("weight", selected?.value ?? "")
            }
            placeholder="Select Weight"
          />
        </div>
        <div key="gst">
          <label className="block text-sm font-medium text-lux-muted mb-1">
            GST (%)
          </label>
          <DataDropdown
            options={gstOptions}
            selectedOptions={formData.gst}
            onChange={(selected) =>
              handleInputChange("gst", selected?.value ?? 0)
            }
            placeholder="Select GST"
          />
        </div>
      </div>
    </Suspense>
  );
};

QuantityPricing.propTypes = {
  formData: PropTypes.object,
  handleChange: PropTypes.func.isRequired,
};

export default QuantityPricing;
