import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);

import statesData from "../../../data/state-city.json";
import Loading from "../../../common/Loading/Loading";

const EditConsigneePopup = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (!initialData) return;

    setFormData(initialData);

    if (initialData.state) {
      const stateInfo = statesData.find(
        (state) => state.state === initialData.state,
      );

      setDistricts(stateInfo ? stateInfo.district : []);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updated = {
      ...formData,
      [name]: value,
    };

    if (name === "gst" && value.length === 15) {
      updated.pan = value.substring(2, 12).toUpperCase();
    }

    setFormData(updated);
  };

  const handleDropdownChange = (selectedOption, field) => {
    if (field === "state") {
      const stateInfo = statesData.find(
        (state) => state.state === selectedOption.value,
      );

      setDistricts(stateInfo ? stateInfo.district : []);

      setFormData({
        ...formData,
        state: selectedOption.value,
        district: "",
      });

      return;
    }

    if (field === "activeStatus") {
      setFormData({
        ...formData,
        activeStatus: selectedOption.value === "Active",
      });

      return;
    }

    setFormData({
      ...formData,
      [field]: selectedOption.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl w-11/12 sm:w-3/4 lg:w-1/2 max-h-[90vh] overflow-y-auto relative">
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            ✖
          </button>

          <h2 className="text-2xl font-bold mb-6 text-center">
            Edit Consignee
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                maxLength="10"
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
                maxLength="15"
              />

              <DataInput
                placeholder="PAN"
                value={formData.pan || ""}
                onChange={handleChange}
                name="pan"
                maxLength="10"
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
                onChange={(option) => handleDropdownChange(option, "state")}
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
                onChange={(option) => handleDropdownChange(option, "district")}
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
                maxLength="6"
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
                onChange={(option) =>
                  handleDropdownChange(option, "activeStatus")
                }
                placeholder="Active Status"
              />
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Update Consignee
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
