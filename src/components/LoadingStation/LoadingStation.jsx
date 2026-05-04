import { useMemo, useCallback, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import statesData from "../../data/state-city.json";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));

const LoadingStation = ({ formData, handleChange }) => {
  const { state } = formData;

  const stateOptions = useMemo(
    () => statesData.map((item) => ({ value: item.state, label: item.state })),
    [],
  );

  const handleInputChange = useCallback(
    (key, value) => {
      handleChange(key, value);
    },
    [handleChange],
  );

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Loading Station
      </label>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Select State
          </label>
          <DataDropdown
            placeholder="Select State"
            options={stateOptions}
            selectedOptions={
              stateOptions.find((o) => o.value === state) || null
            }
            onChange={(opt) => handleInputChange("state", opt?.value ?? "")}
            value={state}
          />
        </div>
      </div>
    </Suspense>
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
