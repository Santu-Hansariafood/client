import DataInput from "../../common/DataInput/DataInput";

const ParameterInputs = ({ parameters, parameterValues, handleChange, notes }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-md shadow-md">
      <h3 className="text-lg font-semibold text-center mb-4">Quality Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parameters.map((param) => (
          <div key={param._id} className="flex flex-col">
            <label className="text-sm font-medium mb-1">{param.parameter}</label>
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
      <div className="mt-6">
        <label className="text-sm font-medium mb-1 block">Notes</label>
        <textarea
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter any additional notes..."
          value={notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
};

export default ParameterInputs;
