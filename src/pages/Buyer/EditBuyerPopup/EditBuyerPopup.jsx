import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const EditBuyerPopup = ({ buyer, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (buyer) {
      setFormData(buyer);
    }
  }, [buyer]);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/buyers/${formData._id}`,
        formData
      );
      onUpdate(response.data);
      toast.success("Buyer updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update buyer data");
      console.error("Error updating buyer data:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-1/2">
        <button
          className="text-gray-500 hover:text-gray-800 mb-2"
          onClick={onClose}
        >
          ✖
        </button>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value.split(",").map((num) => num.trim()),
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Email</label>
              <input
                type="text"
                name="email"
                value={formData.email.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value.split(",").map((mail) => mail.trim()),
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Commodity</label>
              <input
                type="text"
                name="commodity"
                value={formData.commodity.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commodity: e.target.value
                      .split(",")
                      .map((item) => item.trim()),
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Status</label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

EditBuyerPopup.propTypes = {
  buyer: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditBuyerPopup;
