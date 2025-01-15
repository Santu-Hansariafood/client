import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
          `https://phpserver-v77g.onrender.com/api/commodities/${commodityId}`
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
          "https://phpserver-v77g.onrender.com/api/quality-parameters"
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
    setCommodity((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddParameter = () => {
    if (!newQuality) {
      alert("Please select a quality parameter to add.");
      return;
    }

    const selectedQuality = qualityOptions.find(
      (option) => option._id === newQuality
    );

    const updatedParameters = [
      ...(commodity.parameters || []),
      { parameter: selectedQuality.name, _id: newQuality },
    ];

    setCommodity((prev) => ({ ...prev, parameters: updatedParameters }));
    setNewQuality("");
  };

  const handleEditParameter = (index, value) => {
    const updatedParameters = [...(commodity.parameters || [])];
    updatedParameters[index].parameter = value;
    setCommodity((prev) => ({ ...prev, parameters: updatedParameters }));
  };

  const handleRemoveParameter = (index) => {
    if (
      window.confirm("Are you sure you want to remove this quality parameter?")
    ) {
      const updatedParameters = commodity.parameters.filter(
        (_, i) => i !== index
      );
      setCommodity((prev) => ({ ...prev, parameters: updatedParameters }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `https://phpserver-v77g.onrender.com/api/commodities/${commodityId}`,
        commodity
      );
      onUpdate();
      toast.success("Commodity updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating commodity:", error);
      toast.error("Failed to update commodity. Please try again.");
    } finally {
      setIsLoading(false);
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
                <label className="block font-medium">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={commodity.name || ""}
                  onChange={handleChange}
                  className="w-full border px-2 py-1 rounded"
                  placeholder="Enter commodity name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">HSN Code:</label>
                <input
                  type="text"
                  name="hsnCode"
                  value={commodity.hsnCode || ""}
                  onChange={handleChange}
                  className="w-full border px-2 py-1 rounded"
                  placeholder="Enter HSN Code"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">Quality Parameters:</label>
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
                        placeholder="Parameter name"
                      />
                      <button
                        onClick={() => handleRemoveParameter(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
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
                  className={`bg-blue-500 text-white px-4 py-2 rounded ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={onClose}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
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

EditCommodityPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  commodityId: PropTypes.string.isRequired,
};

export default EditCommodityPopup;
