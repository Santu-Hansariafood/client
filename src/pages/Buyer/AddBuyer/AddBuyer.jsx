import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));
import buyerLabels from "../../../language/en/buyer";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { FaPlus, FaTrash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const AddBuyer = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile: [""],
    email: [""],
    group: "",
    companyName: "",
    password: "",
    commodity: [],
    brokerage: {},
    status: "",
    consignee: [],
  });

  const [errors, setErrors] = useState({});
  const [groupOptions, setGroupOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [consigneeOptions, setConsigneeOptions] = useState([]);

  const statusOptions = useMemo(
    () => [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
    []
  );

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [companiesResponse, commoditiesResponse] = await Promise.all([
          axios.get("https://phpserver-v77g.onrender.com/api/companies"),
          axios.get("https://phpserver-v77g.onrender.com/api/commodities"),
        ]);

        const companies = companiesResponse.data;

        setGroupOptions(
          companies.map((company) => ({
            value: company.group,
            label: company.group,
            consignees: company.consignee || [],
          }))
        );

        setCompanyOptions(
          companies.map((company) => ({
            value: company.companyName,
            label: company.companyName,
          }))
        );

        setCommodityOptions(
          commoditiesResponse.data.map((commodity) => ({
            value: commodity.name,
            label: commodity.name,
          }))
        );
      } catch (error) {
        toast.error("Failed to load dropdown data. Please try again.", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleDropdownChange = (selectedOption, actionMeta) => {
    const fieldName = actionMeta.name;

    if (fieldName === "group") {
      const selectedGroup = groupOptions.find(
        (group) => group.value === selectedOption?.value
      );

      setConsigneeOptions(
        selectedGroup?.consignees.map((consignee) => ({
          value: consignee,
          label: consignee,
        })) || []
      );

      setFormData({
        ...formData,
        group: selectedOption,
        consignee: [],
      });
    } else if (fieldName === "commodity") {
      const selectedCommodities = selectedOption || [];
      const newBrokerage = {};

      selectedCommodities.forEach((commodity) => {
        newBrokerage[commodity.value] =
          formData.brokerage[commodity.value] || "";
      });

      setFormData({
        ...formData,
        commodity: selectedCommodities,
        brokerage: newBrokerage,
      });
    } else if (fieldName === "companyName") {
      setFormData({
        ...formData,
        companyName: selectedOption,
      });
    } else {
      setFormData({
        ...formData,
        [fieldName]: selectedOption,
      });
    }
  };

  const handleInputChange = (e, index = null, fieldName = null) => {
    const { name, value } = e.target;

    if (fieldName) {
      const updatedField = [...formData[fieldName]];
      updatedField[index] = value;
      setFormData({ ...formData, [fieldName]: updatedField });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddField = (fieldName) => {
    setFormData({ ...formData, [fieldName]: [...formData[fieldName], ""] });
  };

  const handleRemoveField = (fieldName, index) => {
    const updatedField = [...formData[fieldName]];
    updatedField.splice(index, 1);
    setFormData({ ...formData, [fieldName]: updatedField });
  };

  const handleBrokerageChange = (e, commodity) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      brokerage: {
        ...prevState.brokerage,
        [commodity]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, mobile, email } = formData;

    const newErrors = {};
    if (!regexPatterns.name.test(name)) newErrors.name = "Invalid name format.";
    if (mobile.some((num) => !regexPatterns.mobile.test(num)))
      newErrors.mobile = "Invalid mobile number.";
    if (email.some((mail) => !regexPatterns.email.test(mail)))
      newErrors.email = "Invalid email format.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const payload = {
          ...formData,
          group: formData.group?.value || "",
          companyName: formData.companyName?.value || "",
          commodity: formData.commodity.map((item) => item.value),
          status: formData.status?.value || "",
          brokerage: new Map(
            Object.entries(formData.brokerage).map(([key, value]) => [
              key,
              Number(value),
            ])
          ),
        };

        await axios.post(
          "https://phpserver-v77g.onrender.com/api/buyers",
          payload
        );
        toast.success("Buyer added successfully!");
        setFormData({
          name: "",
          mobile: [""],
          email: [""],
          group: "",
          companyName: "",
          password: "",
          commodity: [],
          brokerage: {},
          status: "",
          consignee: [],
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to add buyer. Please try again.");
      }
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {buyerLabels.title}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                {buyerLabels.title_name}
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
              <label className="block text-gray-700 mb-2" htmlFor="companyName">
                {buyerLabels.company_name_title}
              </label>
              <DataDropdown
                name="companyName"
                options={companyOptions}
                selectedOptions={formData.companyName}
                onChange={(selected) =>
                  handleDropdownChange(selected, { name: "companyName" })
                }
                placeholder="Select Company Name"
                // Removed the isMulti prop
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="group">
                {buyerLabels.company_name}
              </label>
              <DataDropdown
                name="group"
                options={groupOptions}
                selectedOptions={formData.group}
                onChange={(selected) =>
                  handleDropdownChange(selected, { name: "group" })
                }
                placeholder="Select Group of Company"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="password">
                {buyerLabels.password_title}
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
              <label className="block text-gray-700 mb-2">
                {buyerLabels.mobile_title}
              </label>
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
                <FaPlus className="mr-1" /> {buyerLabels.add_mobile}
              </button>
              {errors.mobile && (
                <p className="text-red-500 text-sm">{errors.mobile}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                {buyerLabels.email_title}
              </label>
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
                <FaPlus className="mr-1" /> {buyerLabels.add_email}
              </button>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="commodity">
                {buyerLabels.commodity_title}
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
              {formData.commodity.map((commodity) => (
                <div key={commodity.value} className="mt-4">
                  <label className="block text-gray-700 mb-2">
                    {buyerLabels.brokerage_per_ton_title} {commodity.label}
                  </label>
                  <DataInput
                    name={`brokerage-${commodity.value}`}
                    placeholder={`Enter brokerage for ${commodity.label}`}
                    value={formData.brokerage[commodity.value]}
                    onChange={(e) => handleBrokerageChange(e, commodity.value)}
                    inputType="number"
                    min="0"
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="consignee">
                {buyerLabels.consignee_title}
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
                {buyerLabels.status_title}
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
            <Buttons label="Submit" type="submit" variant="primary" size="md" />
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
  );
};

export default AddBuyer;
