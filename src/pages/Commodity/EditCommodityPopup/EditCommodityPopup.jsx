import { useState, useEffect } from "react";
import axios from "axios";

const EditCommodityPopup = ({ isOpen, onClose, commodityId, onUpdate }) => {
  const [commodity, setCommodity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qualityOptions, setQualityOptions] = useState([]);
  const [newQuality, setNewQuality] = useState("");

  useEffect(() => {
    const fetchCommodity = async () => {
      if (!commodityId) return;
      setIsLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/commodities/${commodityId}`
        );
        setCommodity(response.data);
      } catch (error) {
        console.error("Error fetching commodity:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchQualityParameters = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/quality-parameters"
        );
        setQualityOptions(response.data);
      } catch (error) {
        console.error("Error fetching quality parameters:", error);
      }
    };

    if (isOpen) {
      fetchCommodity();
      fetchQualityParameters();
    }
  }, [isOpen, commodityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCommodity({ ...commodity, [name]: value });
  };

  const handleAddParameter = () => {
    if (!newQuality) return;

    const selectedQuality = qualityOptions.find(
      (option) => option._id === newQuality
    );

    const updatedParameters = [
      ...(commodity.parameters || []),
      { parameter: selectedQuality.name, _id: newQuality },
    ];

    setCommodity({ ...commodity, parameters: updatedParameters });
    setNewQuality("");
  };

  const handleEditParameter = (index, value) => {
    const updatedParameters = [...commodity.parameters];
    updatedParameters[index].parameter = value;
    setCommodity({ ...commodity, parameters: updatedParameters });
  };

  const handleRemoveParameter = (index) => {
    const updatedParameters = commodity.parameters.filter(
      (_, i) => i !== index
    );
    setCommodity({ ...commodity, parameters: updatedParameters });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/commodities/${commodityId}`,
        commodity
      );
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating commodity:", error);
    }
  };

  if (!isOpen) return null;

  const availableOptions = qualityOptions.filter(
    (option) =>
      !commodity?.parameters?.some((param) => param._id === option._id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Edit Commodity</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          commodity && (
            <>
              <div className="mb-4">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={commodity.name || ""}
                  onChange={handleChange}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div className="mb-4">
                <label>HSN Code:</label>
                <input
                  type="text"
                  name="hsnCode"
                  value={commodity.hsnCode || ""}
                  onChange={handleChange}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div className="mb-4">
                <label>Quality Parameters:</label>
                <ul className="list-disc pl-5">
                  {commodity.parameters?.map((param, index) => (
                    <li key={index} className="mb-2 flex items-center">
                      <input
                        type="text"
                        value={param.parameter}
                        onChange={(e) =>
                          handleEditParameter(index, e.target.value)
                        }
                        className="border px-2 py-1 rounded w-full"
                      />
                      <button
                        onClick={() => handleRemoveParameter(index)}
                        className="ml-2 text-red-500"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex mt-2 items-center">
                  <select
                    value={newQuality}
                    onChange={(e) => setNewQuality(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="">Select Quality</option>
                    {availableOptions.map((option) => (
                      <option key={option._id} value={option._id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddParameter}
                    className="ml-2 bg-green-500 text-white px-4 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button onClick={onClose} className="ml-4 text-gray-500">
                  Cancel
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default EditCommodityPopup;
