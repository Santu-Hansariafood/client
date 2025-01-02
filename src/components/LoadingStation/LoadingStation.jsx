import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import DataDropdown from "../../common/DataDropdown/DataDropdown";
import DataInput from "../../common/DataInput/DataInput";
import statesData from "../../data/state-city.json";

const LoadingStation = ({ formData, handleChange }) => {
  const { state, location } = formData;

  const stateOptions = useMemo(
    () => statesData.map((item) => ({ value: item.state, label: item.state })),
    []
  );

  const handleInputChange = useCallback(
    (key, value) => {
      handleChange(key, value);
    },
    [handleChange]
  );

  return (
    <div>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Loading Station
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Select State
          </label>
          <DataDropdown
            placeholder="Select State"
            options={stateOptions}
            onChange={(selectedOption) =>
              handleInputChange("state", selectedOption.value)
            }
            value={state}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Enter Location
          </label>
          <DataInput
            placeholder="Enter Location"
            value={location || ""}
            onChange={(e) => handleInputChange("location", e.target.value)}
            name="location"
            required
          />
        </div>
      </div>
    </div>
  );
};

LoadingStation.propTypes = {
  formData: PropTypes.shape({
    state: PropTypes.string,
    location: PropTypes.string,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default LoadingStation;
