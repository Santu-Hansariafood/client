import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import statesData from "../../../data/state-city.json";

const EditConsigneePopup = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const initialState = initialData.state;
      if (initialState) {
        const stateInfo = statesData.find(
          (state) => state.state === initialState
        );
        setDistricts(stateInfo ? stateInfo.district : []);
      }
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDropdownChange = (selectedOption, fieldName) => {
    if (fieldName === "state") {
      const stateInfo = statesData.find(
        (state) => state.state === selectedOption.value
      );
      setDistricts(stateInfo ? stateInfo.district : []);
      setFormData({ ...formData, state: selectedOption.value, district: "" });
    } else {
      setFormData({ ...formData, [fieldName]: selectedOption.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-3/4 max-h-screen overflow-auto">
        <button
          className="text-gray-500 hover:text-gray-800 mb-2"
          onClick={onClose}
        >
          Close
        </button>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <DataInput
              placeholder="Name"
              value={formData.name || ""}
              onChange={handleChange}
              name="name"
              required
            />
            <DataInput
              placeholder="Phone"
              value={formData.phone || ""}
              onChange={handleChange}
              name="phone"
              inputType="tel"
            />
            <DataInput
              placeholder="Email"
              value={formData.email || ""}
              onChange={handleChange}
              name="email"
              inputType="email"
            />
            <DataInput
              placeholder="GST"
              value={formData.gst || ""}
              onChange={handleChange}
              name="gst"
            />
            <DataInput
              placeholder="PAN"
              value={formData.pan || ""}
              onChange={handleChange}
              name="pan"
            />
            <DataDropdown
              options={statesData.map((state) => ({
                value: state.state,
                label: state.state,
              }))}
              selectedOptions={{
                value: formData.state || "",
                label: formData.state || "Select State",
              }}
              onChange={(selectedOption) =>
                handleDropdownChange(selectedOption, "state")
              }
              placeholder="State"
            />
            <DataDropdown
              options={districts.map((district) => ({
                value: district,
                label: district,
              }))}
              selectedOptions={{
                value: formData.district || "",
                label: formData.district || "Select District",
              }}
              onChange={(selectedOption) =>
                handleDropdownChange(selectedOption, "district")
              }
              placeholder="District"
            />
            <DataInput
              placeholder="Location"
              value={formData.location || ""}
              onChange={handleChange}
              name="location"
            />
            <DataInput
              placeholder="Pin"
              value={formData.pin || ""}
              onChange={handleChange}
              name="pin"
            />
            <DataInput
              placeholder="Contact Person"
              value={formData.contactPerson || ""}
              onChange={handleChange}
              name="contactPerson"
            />
            <DataInput
              placeholder="Mandi License"
              value={formData.mandiLicense || ""}
              onChange={handleChange}
              name="mandiLicense"
            />
            <DataDropdown
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              selectedOptions={{
                value: formData.activeStatus ? "Active" : "Inactive",
                label: formData.activeStatus ? "Active" : "Inactive",
              }}
              onChange={(selectedOption) =>
                handleDropdownChange(selectedOption, "activeStatus")
              }
              placeholder="Active Status"
            />
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

EditConsigneePopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditConsigneePopup;
