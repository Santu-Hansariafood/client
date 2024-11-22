import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const EditBuyerPopup = ({ buyer, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [commodities, setCommodities] = useState([]);

  useEffect(() => {
    if (buyer) {
      setFormData({
        ...buyer,
        mobile: buyer.mobile || [""],
        email: buyer.email || [""],
        password: buyer.password || "",
        commodity: buyer.commodity || [""],
      });
    }
  }, [buyer]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/companies");
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    const fetchCommodities = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/api/commodities"
        );
        setCommodities(data);
      } catch (error) {
        console.error("Error fetching commodities:", error);
      }
    };

    fetchCompanies();
    fetchCommodities();
  }, []);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayChange = (name, index, value) => {
    const updatedArray = [...formData[name]];
    updatedArray[index] = value;
    setFormData({ ...formData, [name]: updatedArray });
  };

  const addField = (name) => {
    setFormData({ ...formData, [name]: [...formData[name], ""] });
  };

  const removeField = (name, index) => {
    const updatedArray = formData[name].filter((_, i) => i !== index);
    setFormData({ ...formData, [name]: updatedArray });
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
    } catch (error) {
      console.error("Error updating buyer:", error.response || error.message);
      toast.error("Failed to update buyer");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
      <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <button
          className="absolute top-3 right-3 text-gray-700 hover:text-red-500 font-bold text-lg"
          onClick={onClose}
          title="Close"
        >
          ✖
        </button>
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">Edit Buyer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="block font-semibold">Password</label>
              <input
                type="text"
                name="password"
                value={formData.password || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold">Company Name</label>
              <select
                name="companyName"
                value={formData.companyName || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company._id} value={company.companyName}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold">Commodity</label>
              {formData.commodity.map((comm, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <select
                    value={comm}
                    onChange={(e) =>
                      handleArrayChange("commodity", index, e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Commodity</option>
                    {commodities.map((commodity) => (
                      <option key={commodity._id} value={commodity.name}>
                        {commodity.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField("commodity", index)}
                    className="p-1 bg-red-500 text-white rounded"
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField("commodity")}
                className="text-blue-500 mt-2"
              >
                Add Commodity
              </button>
            </div>
            <div>
              <label className="block font-semibold">Mobile</label>
              {formData.mobile.map((number, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={number}
                    onChange={(e) =>
                      handleArrayChange("mobile", index, e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeField("mobile", index)}
                    className="p-1 bg-red-500 text-white rounded"
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField("mobile")}
                className="text-blue-500"
              >
                Add Mobile
              </button>
            </div>
            <div>
              <label className="block font-semibold">Email</label>
              {formData.email.map((email, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      handleArrayChange("email", index, e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeField("email", index)}
                    className="p-1 bg-red-500 text-white rounded"
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField("email")}
                className="text-blue-500"
              >
                Add Email
              </button>
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
            className="mt-6 bg-green-500 text-white px-4 py-2 rounded"
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
