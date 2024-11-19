import { useState, useEffect } from "react";
import axios from "axios";

const EditCommodityPopup = ({ isOpen, onClose, commodityId, onUpdate }) => {
  const [commodity, setCommodity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

    if (isOpen) {
      fetchCommodity();
    }
  }, [isOpen, commodityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCommodity({ ...commodity, [name]: value });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/commodities/${commodityId}`,
        commodity
      );
      onUpdate(); // Refresh data in parent component
      onClose(); // Close the popup
    } catch (error) {
      console.error("Error updating commodity:", error);
    }
  };

  if (!isOpen) return null;

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
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button onClick={onClose} className="ml-4 text-gray-500">
                Cancel
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default EditCommodityPopup;
