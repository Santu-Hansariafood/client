import { useState, useEffect, lazy, Suspense } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));
import stateCityData from "../../../data/state-city.json";
import Loading from "../../../common/Loading/Loading";
import addConsigneeLable from "../../../language/en/addConsignee";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaTruck } from "react-icons/fa";

import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const AddConsignee = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gst: "",
    pan: "",
    state: "",
    district: "",
    location: "",
    pin: "",
    contactPerson: "",
    mandiLicense: "",
    activeStatus: "active",
  });

  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  const activeOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    const states = stateCityData.map((entry) => ({
      value: entry.state,
      label: entry.state,
    }));
    setStateOptions(states);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: value,
    };

    if (name === "gst") {
      if (value === "0") {
        newFormData.pan = "";
      } else if (value.length === 15) {
        const pan = value.substring(2, 12).toUpperCase();
        newFormData.pan = pan;
      } else {
        newFormData.pan = "";
      }
    }

    setFormData(newFormData);
  };

  const handleDropdownChange = (selectedOption, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption ? selectedOption.value : "",
    }));

    if (fieldName === "state") {
      const selectedState = stateCityData.find(
        (entry) => entry.state === selectedOption.value,
      );
      const districts = selectedState
        ? selectedState.district.map((district) => ({
            value: district,
            label: district,
          }))
        : [];
      setDistrictOptions(districts);
      setFormData((prevData) => ({ ...prevData, district: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.phone && !regexPatterns.mobile.test(formData.phone)) {
      toast.error("Invalid phone number format.");
      return;
    }

    if (formData.email && !regexPatterns.email.test(formData.email)) {
      toast.error("Invalid email format.");
      return;
    }

    if (formData.gst === "0") {
      if (!formData.pan) {
        toast.error("PAN number is required when GST is 0");
        return;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan)) {
        toast.error("Invalid PAN number format.");
        return;
      }
    } else {
      if (formData.gst && !regexPatterns.gstNo.test(formData.gst)) {
        toast.error("Invalid GST number format.");
        return;
      }
    }

    if (
      formData.gst !== "0" &&
      formData.pan &&
      !regexPatterns.panNo.test(formData.pan)
    ) {
      toast.error("Invalid PAN number format.");
      return;
    }
    if (formData.pin && formData.pin.length !== 6) {
      toast.error("Pin code must be 6 digits");
      return;
    }

    try {
      const response = await api.post("/consignees", formData);
      if (response.status === 201) {
        toast.success("Consignee added successfully!");
        setFormData({
          name: "",
          phone: "",
          email: "",
          gst: "",
          pan: "",
          state: "",
          district: "",
          location: "",
          pin: "",
          contactPerson: "",
          mandiLicense: "",
          activeStatus: "active",
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to add consignee. Please try again.",
      );
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add Consignee"
        subtitle="Register a new consignee with contact and location details"
        icon={FaTruck}
        noContentCard
      >
        <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_name}
                </label>
                <DataInput
                  placeholder="Enter Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_phone}
                </label>
                <DataInput
                  placeholder="Enter Phone Number"
                  name="phone"
                  inputType="tel"
                  value={formData.phone}
                  minLength="10"
                  maxLength="10"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_email}
                </label>
                <DataInput
                  placeholder="Enter Email"
                  name="email"
                  inputType="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_gst}
                </label>
                <DataInput
                  placeholder="Enter GST"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  maxLength="15"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_pan}
                </label>
                <DataInput
                  placeholder={
                    formData.gst === "0" ? "Enter PAN" : "Auto-filled PAN"
                  }
                  name="pan"
                  value={formData.pan}
                  onChange={handleInputChange}
                  maxLength="10"
                  minLength="10"
                  required={formData.gst === "0"}
                  disabled={formData.gst !== "0"}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_state}
                </label>
                <DataDropdown
                  options={stateOptions}
                  selectedOptions={stateOptions.find(
                    (option) => option.value === formData.state,
                  )}
                  onChange={(selected) =>
                    handleDropdownChange(selected, "state")
                  }
                  placeholder="Select State"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_district}
                </label>
                <DataDropdown
                  options={districtOptions}
                  selectedOptions={districtOptions.find(
                    (option) => option.value === formData.district,
                  )}
                  onChange={(selected) =>
                    handleDropdownChange(selected, "district")
                  }
                  placeholder="Select District"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_location}
                </label>
                <DataInput
                  placeholder="Enter Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_pin}
                </label>
                <DataInput
                  placeholder="Enter Pin"
                  name="pin"
                  inputType="text"
                  value={formData.pin}
                  minLength="6"
                  maxLength="6"
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_contact}
                </label>
                <DataInput
                  placeholder="Enter Contact Person Name"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_mandi_license}
                </label>
                <DataInput
                  placeholder="Enter Mandi License"
                  name="mandiLicense"
                  value={formData.mandiLicense}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {addConsigneeLable.consignee_active_status}
                </label>
                <DataDropdown
                  options={activeOptions}
                  selectedOptions={activeOptions.find(
                    (option) => option.value === formData.activeStatus,
                  )}
                  onChange={(selected) =>
                    handleDropdownChange(selected, "activeStatus")
                  }
                  placeholder="Select Status"
                />
              </div>
            </div>
            <div className="mt-6">
              <Buttons
                label="Submit"
                onClick={handleSubmit}
                type="submit"
                variant="primary"
                size="md"
              />
            </div>
          </form>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddConsignee;
