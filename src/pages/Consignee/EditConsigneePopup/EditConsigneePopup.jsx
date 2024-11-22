import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
import statesData from "../../../data/state-city.json";
import Loading from "../../../common/Loading/Loading";

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
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-11/12 sm:w-3/4 lg:w-1/2 max-h-screen overflow-auto relative">
          <button
            className="text-gray-500 hover:text-gray-800 absolute top-2 right-2"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">
            Edit Consignee Details
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit Name
                </label>
                <DataInput
                  placeholder="Name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  name="name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit Phone
                </label>
                <DataInput
                  placeholder="Phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  name="phone"
                  inputType="tel"
                  maxLength="10"
                  minLength="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit Email
                </label>
                <DataInput
                  placeholder="Email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  name="email"
                  inputType="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit GST No.
                </label>
                <DataInput
                  placeholder="GST"
                  value={formData.gst || ""}
                  onChange={handleChange}
                  name="gst"
                  maxLength="16"
                  minLength="16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit PAN No.
                </label>
                <DataInput
                  placeholder="PAN"
                  value={formData.pan || ""}
                  onChange={handleChange}
                  name="pan"
                  maxLength="10"
                  minLength="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit State
                </label>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit District
                </label>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit Location
                </label>
                <DataInput
                  placeholder="Location"
                  value={formData.location || ""}
                  onChange={handleChange}
                  name="location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Edit Pin
                </label>
                <DataInput
                  placeholder="Pin"
                  value={formData.pin || ""}
                  onChange={handleChange}
                  name="pin"
                  maxLength="6"
                  minLength="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <DataInput
                  placeholder="Contact Person"
                  value={formData.contactPerson || ""}
                  onChange={handleChange}
                  name="contactPerson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mandi License
                </label>
                <DataInput
                  placeholder="Mandi License"
                  value={formData.mandiLicense || ""}
                  onChange={handleChange}
                  name="mandiLicense"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Active Status
                </label>
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
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </Suspense>
  );
};

EditConsigneePopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditConsigneePopup;
