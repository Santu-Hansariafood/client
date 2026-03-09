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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {parameters.map((param) => (
          <div key={param._id} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              {param.parameter}
            </label>

            <DataInput
              placeholder={`Enter ${param.parameter}`}
              value={parameterValues[param._id] || ""}
              onChange={(e) =>
                handleChange("parameterValues", {
                  ...parameterValues,
                  [param._id]: e.target.value,
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600">
          Notes
        </label>

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
