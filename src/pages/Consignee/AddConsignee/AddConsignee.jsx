import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));
import stateCityData from "../../../data/state-city.json";
import Loading from "../../../common/Loading/Loading";

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
    activeStatus: "",
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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDropdownChange = (selectedOption, fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: selectedOption ? selectedOption.value : "",
    });

    if (fieldName === "state") {
      const selectedState = stateCityData.find(
        (entry) => entry.state === selectedOption.value
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
    try {
      const response = await axios.post(
        "http://localhost:5000/api/consignees",
        formData
      );
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
          activeStatus: "",
        });
      }
    } catch (error) {
      toast.error("Failed to add consignee. Please try again.");
      console.error(error);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Consignee</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <DataInput
                  placeholder="Enter Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone</label>
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
                <label className="block mb-1 font-medium">Email</label>
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
                <label className="block mb-1 font-medium">GST</label>
                <DataInput
                  placeholder="Enter GST"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  maxLength="16"
                  minLength="16"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">PAN</label>
                <DataInput
                  placeholder="Enter PAN"
                  name="pan"
                  value={formData.pan}
                  onChange={handleInputChange}
                  maxLength="10"
                  minLength="10"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">State</label>
                <DataDropdown
                  options={stateOptions}
                  selectedOptions={stateOptions.find(
                    (option) => option.value === formData.state
                  )}
                  onChange={(selected) =>
                    handleDropdownChange(selected, "state")
                  }
                  placeholder="Select State"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">District</label>
                <DataDropdown
                  options={districtOptions}
                  selectedOptions={districtOptions.find(
                    (option) => option.value === formData.district
                  )}
                  onChange={(selected) =>
                    handleDropdownChange(selected, "district")
                  }
                  placeholder="Select District"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Location</label>
                <DataInput
                  placeholder="Enter Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Pin</label>
                <DataInput
                  placeholder="Enter Pin"
                  name="pin"
                  inputType="number"
                  value={formData.pin}
                  minLength="6"
                  maxLength="6"
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Contact Person</label>
                <DataInput
                  placeholder="Enter Contact Person Name"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Mandi License</label>
                <DataInput
                  placeholder="Enter Mandi License"
                  name="mandiLicense"
                  value={formData.mandiLicense}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Active Status</label>
                <DataDropdown
                  options={activeOptions}
                  selectedOptions={activeOptions.find(
                    (option) => option.value === formData.activeStatus
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
      </div>
    </Suspense>
  );
};

export default AddConsignee;
