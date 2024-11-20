import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const EditCompanyPopup = ({ company, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(company || {});

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayChange = (index, field, value) => {
    const updatedConsignee = [...formData.consignee];
    updatedConsignee[index] = value;
    setFormData({ ...formData, consignee: updatedConsignee });
  };

  const handleCommodityChange = (index, paramIndex, field, value) => {
    const updatedCommodities = [...formData.commodities];
    updatedCommodities[index].parameters[paramIndex][field] = value;
    setFormData({ ...formData, commodities: updatedCommodities });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Make an API call to update the database
      const response = await axios.put(
        `http://localhost:5000/api/companies/${formData._id}`,
        formData
      );

      // Update the parent component state with the updated company data
      onUpdate(response.data); // Pass the updated data to the parent
      toast.success("Company updated successfully in the database");

      // Close the popup
      onClose();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-1/2 overflow-auto max-h-screen">
        <button
          className="text-gray-500 hover:text-gray-800 mb-2"
          onClick={onClose}
        >
          X
        </button>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
              <label className="block font-semibold">Phone Number</label>
              <input
                type="text"
                name="companyPhone"
                value={formData.companyPhone || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Email</label>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Consignee</label>
              {formData.consignee?.map((consignee, index) => (
                <input
                  key={index}
                  type="text"
                  value={consignee}
                  onChange={(e) =>
                    handleArrayChange(index, "consignee", e.target.value)
                  }
                  className="w-full p-2 border rounded mb-2"
                />
              ))}
            </div>
            <div>
              <label className="block font-semibold">Group</label>
              <input
                type="text"
                name="group"
                value={formData.group || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Commodities</label>
              {formData.commodities?.map((commodity, index) => (
                <div key={index} className="border p-2 rounded mb-2">
                  <p>
                    <strong>{commodity.name}</strong>
                  </p>
                  {commodity.parameters.map((param, paramIndex) => (
                    <div key={paramIndex}>
                      <label className="block">
                        Parameter: {param.parameter}
                      </label>
                      <input
                        type="text"
                        value={param.value || ""}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            paramIndex,
                            "value",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded mb-2"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div>
              <label className="block font-semibold">Mandi License</label>
              <input
                type="text"
                name="mandiLicense"
                value={formData.mandiLicense || "N/A"}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Status</label>
              <select
                name="activeStatus"
                value={formData.activeStatus ? "Active" : "Inactive"}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "activeStatus",
                      value: e.target.value === "Active",
                    },
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditCompanyPopup.propTypes = {
  company: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditCompanyPopup;
