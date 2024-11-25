import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { FaPlus, FaTrash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const AddBuyer = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile: [""],
    email: [""],
    companyName: "",
    password: "",
    commodity: [],
    status: "",
    consignee: [],
  });

  const [errors, setErrors] = useState({});
  const [companyOptions, setCompanyOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [consigneeOptions, setConsigneeOptions] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/companies");
        console.log("Fetched Companies:", response.data);

        const sortedCompanies = response.data.map((company) => ({
          value: company.companyName,
          label: company.companyName,
          consignees: company.consignee || [],
        }));

        console.log("Transformed Companies:", sortedCompanies);
        setCompanyOptions(sortedCompanies);
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast.error("Failed to load companies. Please try again.");
      }
    };

    const fetchCommodities = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/commodities"
        );

        const sortedCommodities = response.data
          .map((commodity) => ({
            value: commodity.name,
            label: commodity.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCommodityOptions(sortedCommodities);
      } catch (error) {
        toast.error("Failed to load commodities. Please try again.", error);
      }
    };

    fetchCompanies();
    fetchCommodities();
  }, []);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const handleInputChange = (e, index = null, fieldName) => {
    const { name, value } = e.target;

    if (fieldName) {
      const updatedField = [...formData[fieldName]];
      updatedField[index] = value;
      setFormData({
        ...formData,
        [fieldName]: updatedField,
      });

      if (fieldName === "mobile" && !regexPatterns.mobile.test(value)) {
        setErrors((prev) => ({ ...prev, mobile: "Invalid mobile number." }));
      } else if (fieldName === "email" && !regexPatterns.email.test(value)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format." }));
      } else {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
      if (name === "name" && !regexPatterns.name.test(value)) {
        setErrors((prev) => ({ ...prev, name: "Invalid name format." }));
      }
    }
  };

  const handleAddField = (fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: [...formData[fieldName], ""],
    });
  };

  const handleRemoveField = (fieldName, index) => {
    const updatedField = [...formData[fieldName]];
    updatedField.splice(index, 1);
    setFormData({
      ...formData,
      [fieldName]: updatedField,
    });
  };

  const handleDropdownChange = (selectedOption, actionMeta) => {
    if (actionMeta.name === "companyName") {
      const selectedCompany = companyOptions.find(
        (company) => company.value === selectedOption?.value
      );

      console.log("Selected Company:", selectedCompany);

      setConsigneeOptions(
        selectedCompany?.consignees.map((consignee) => ({
          value: consignee,
          label: consignee,
        })) || []
      );

      setFormData({
        ...formData,
        companyName: selectedOption,
        consignee: [],
      });
    } else {
      setFormData({
        ...formData,
        [actionMeta.name]: selectedOption,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;
    const newErrors = {};

    if (!regexPatterns.name.test(formData.name)) {
      newErrors.name = "Invalid name format.";
      isValid = false;
    }
    if (formData.email.some((email) => !regexPatterns.email.test(email))) {
      newErrors.email = "Invalid email format.";
      isValid = false;
    }
    if (formData.mobile.some((mobile) => !regexPatterns.mobile.test(mobile))) {
      newErrors.mobile = "Invalid mobile number.";
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      const transformedData = {
        ...formData,
        companyName: formData.companyName?.value || "",
        commodity: formData.commodity.map((item) => item.value),
        status: formData.status?.value || "",
      };

      try {
        const response = await axios.post(
          "http://localhost:5000/api/buyers",
          transformedData
        );
        toast.success("Buyer added successfully!", response);
      } catch (error) {
        toast.error("Failed to add buyer. Please try again.", error);
      }
    }
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg bg-white">
          <h2 className="text-2xl font-semibold mb-6 text-center">Add Buyer</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Name
                </label>
                <DataInput
                  name="name"
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="companyName"
                >
                  Company Name
                </label>
                <DataDropdown
                  name="companyName"
                  options={companyOptions}
                  selectedOptions={formData.companyName}
                  onChange={(selected) =>
                    handleDropdownChange(selected, { name: "companyName" })
                  }
                  placeholder="Select Company"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Mobile</label>
                {formData.mobile.map((mobile, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <DataInput
                      name={`mobile-${index}`}
                      placeholder="Enter Mobile"
                      inputType="tel"
                      value={mobile}
                      onChange={(e) => handleInputChange(e, index, "mobile")}
                      required
                      maxLength="10"
                      minLength="10"
                    />
                    {formData.mobile.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField("mobile", index)}
                        className="text-red-500"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddField("mobile")}
                  className="text-blue-500 flex items-center mt-2"
                >
                  <FaPlus className="mr-1" /> Add Mobile
                </button>
                {errors.mobile && (
                  <p className="text-red-500 text-sm">{errors.mobile}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                {formData.email.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <DataInput
                      name={`email-${index}`}
                      placeholder="Enter Email"
                      inputType="email"
                      value={email}
                      onChange={(e) => handleInputChange(e, index, "email")}
                      required
                    />
                    {formData.email.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField("email", index)}
                        className="text-red-500"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddField("email")}
                  className="text-blue-500 flex items-center mt-2"
                >
                  <FaPlus className="mr-1" /> Add Email
                </button>
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <DataInput
                  name="password"
                  placeholder="Enter Password"
                  inputType="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="4"
                  maxLength="25"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="commodity">
                  Commodity
                </label>
                <DataDropdown
                  name="commodity"
                  options={commodityOptions}
                  selectedOptions={formData.commodity}
                  onChange={(selected) =>
                    handleDropdownChange(selected, { name: "commodity" })
                  }
                  placeholder="Select Commodity"
                  isMulti
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="consignee">
                  Consignee
                </label>
                <DataDropdown
                  name="consignee"
                  options={consigneeOptions}
                  selectedOptions={formData.consignee}
                  onChange={(selected) =>
                    handleDropdownChange(selected, { name: "consignee" })
                  }
                  placeholder="Select Consignee"
                  isMulti
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="status">
                  Status
                </label>
                <DataDropdown
                  name="status"
                  options={statusOptions}
                  selectedOptions={formData.status}
                  onChange={(selected) =>
                    handleDropdownChange(selected, { name: "status" })
                  }
                  placeholder="Select Status"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Buttons
                label="Submit"
                type="submit"
                variant="primary"
                size="md"
              />
            </div>
          </form>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar
            closeOnClick
            pauseOnHover
          />
        </div>
      </Suspense>
    </>
  );
};

export default AddBuyer;
