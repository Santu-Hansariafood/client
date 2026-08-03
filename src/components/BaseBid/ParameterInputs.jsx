import DataInput from "../../common/DataInput/DataInput";

const ParameterInputs = ({
  parameters,
  parameterValues,
  handleChange,
  notes,
}) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
        Quality Parameters
      </h3>

      <div className="grid grid-cols-1 gap-5">
        {parameters.map((param) => (
          <div key={param._id} className="space-y-3">
            <label className="text-sm font-medium text-gray-600">
              {param.parameter}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Base Value</span>
                <DataInput
                  placeholder={`Enter ${param.parameter} Base Value`}
                  value={parameterValues[param._id]?.baseValue || ""}
                  onChange={(e) =>
                    handleChange("parameterValues", {
                      ...parameterValues,
                      [param._id]: {
                        ...parameterValues[param._id],
                        baseValue: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Max Value</span>
                <DataInput
                  placeholder={`Enter ${param.parameter} Max Value`}
                  value={parameterValues[param._id]?.maxValue || ""}
                  onChange={(e) =>
                    handleChange("parameterValues", {
                      ...parameterValues,
                      [param._id]: {
                        ...parameterValues[param._id],
                        maxValue: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600">Notes</label>

        <textarea
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl
          focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500
          placeholder-gray-400 text-gray-800 transition-all duration-200
          hover:border-green-400 resize-none shadow-sm"
          placeholder="Enter any additional notes..."
          value={notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default ParameterInputs;
