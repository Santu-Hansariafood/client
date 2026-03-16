import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import Loading from "../../../common/Loading/Loading";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import statesData from "../../../data/state-city.json";
import { toast } from "react-toastify";
import Buttons from "../../../common/Buttons/Buttons";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);

const EditConsigneePopup = ({ initialData, onSubmit, onCancel }) => {
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

    if (formData.phone && !regexPatterns.mobile.test(formData.phone)) {
      toast.error("Invalid phone number format.");
      return;
    }
    if (formData.email && !regexPatterns.email.test(formData.email)) {
      toast.error("Invalid email format.");
      return;
    }

    onSubmit(formData);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="bg-white p-2">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <DataInput
              label="Consignee Name"
              placeholder="Enter Consignee Name"
              value={formData.name || ""}
              onChange={handleChange}
              name="name"
              required
            />

            <DataInput
              label="Phone Number"
              placeholder="Enter Phone Number"
              value={formData.phone || ""}
              onChange={handleChange}
              name="phone"
              inputType="tel"
              maxLength="10"
            />

            <DataInput
              label="Email Address"
              placeholder="Enter Email Address"
              value={formData.email || ""}
              onChange={handleChange}
              name="email"
              inputType="email"
            />

            <DataInput
              label="GST Number"
              placeholder="Enter GST Number"
              value={formData.gst || ""}
              onChange={handleChange}
              name="gst"
              maxLength="15"
            />

            <DataInput
              label="PAN Number"
              placeholder="Enter PAN Number"
              value={formData.pan || ""}
              onChange={handleChange}
              name="pan"
              maxLength="10"
            />

            <DataDropdown
              label="State"
              options={statesData.map((state) => ({
                value: state.state,
                label: state.state,
              }))}
              selectedOptions={{
                value: formData.state || "",
                label: formData.state || "Select State",
              }}
              onChange={(option) => handleDropdownChange(option, "state")}
              placeholder="Select State"
            />

            <DataDropdown
              label="District"
              options={districts.map((district) => ({
                value: district,
                label: district,
              }))}
              selectedOptions={{
                value: formData.district || "",
                label: formData.district || "Select District",
              }}
              onChange={(option) => handleDropdownChange(option, "district")}
              placeholder="Select District"
            />

            <DataInput
              label="Location"
              placeholder="Enter Location"
              value={formData.location || ""}
              onChange={handleChange}
              name="location"
            />

            <DataInput
              label="Pin Code"
              placeholder="Enter Pin Code"
              value={formData.pin || ""}
              onChange={handleChange}
              name="pin"
              maxLength="6"
            />

            <DataInput
              label="Contact Person"
              placeholder="Enter Contact Person"
              value={formData.contactPerson || ""}
              onChange={handleChange}
              name="contactPerson"
            />

            <DataInput
              label="Mandi License"
              placeholder="Enter Mandi License"
              value={formData.mandiLicense || ""}
              onChange={handleChange}
              name="mandiLicense"
            />

            <DataDropdown
              label="Active Status"
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
              placeholder="Select Status"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Buttons
              label="Cancel"
              variant="secondary"
              onClick={onCancel}
              size="lg"
            />
            <Buttons
              label="Update Consignee"
              variant="primary"
              type="submit"
              size="lg"
            />
          </div>
        </form>
      </div>
    </Suspense>
  );
};

EditConsigneePopup.propTypes = {
  initialData: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default EditConsigneePopup;
