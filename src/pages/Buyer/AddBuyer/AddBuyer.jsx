import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUserPlus } from "react-icons/fa";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));
import buyerLabels from "../../../language/en/buyer";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { FaPlus, FaTrash } from "react-icons/fa";

const AddBuyer = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile: [""],
    email: [""],
    group: null,
    company: [],
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
  const [companiesData, setCompaniesData] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

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
        const [companiesResponse, groupsResponse] = await Promise.all([
          axios.get("/companies"),
          axios.get("/groups"),
        ]);

        const companies = companiesResponse.data?.data || companiesResponse.data || [];
        const groups = groupsResponse.data?.data || groupsResponse.data || [];

        setCompaniesData(companies);
        setCompanyOptions(
          companies
            .map((c) => ({ value: String(c._id), label: c.companyName }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        setGroupOptions(
          groups
            .map((g) => ({ value: String(g._id), label: g.groupName }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        setCommodityOptions([]);
        setConsigneeOptions([]);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load dropdown data. Please try again.");
      }
    };

    fetchDropdownData();
  }, []);

  const handleDropdownChange = (selectedOption, actionMeta) => {
    const fieldName = actionMeta.name;

    if (fieldName === "company") {
      const selectedCompanies = selectedOption || [];
      const selectedCompanyIds = selectedCompanies.map((c) => String(c.value));
      const selectedCompaniesData = companiesData.filter((c) =>
        selectedCompanyIds.includes(String(c._id)),
      );

      // Accumulate commodities and consignees from all selected companies
      const allCommoditiesMap = new Map();
      const allConsigneesMap = new Map();

      selectedCompaniesData.forEach((company) => {
        (company.commodities || []).forEach((c) => {
          const commodityId = String(c._id || c.commodityId);
          if (!allCommoditiesMap.has(commodityId)) {
            allCommoditiesMap.set(commodityId, {
              value: commodityId,
              label: c.name,
              brokerage: c.brokerage ?? 0,
            });
          }
        });

        if (Array.isArray(company.consigneeIds)) {
          company.consigneeIds.forEach((id, idx) => {
            const consigneeId = String(id);
            if (!allConsigneesMap.has(consigneeId)) {
              allConsigneesMap.set(consigneeId, {
                value: consigneeId,
                label: company.consignee?.[idx] || "Consignee",
              });
            }
          });
        }
      });

      const combinedCommodities = Array.from(allCommoditiesMap.values()).sort(
        (a, b) => a.label.localeCompare(b.label),
      );
      const combinedConsignees = Array.from(allConsigneesMap.values()).sort(
        (a, b) => a.label.localeCompare(b.label),
      );

      const newBrokerage = {};
      combinedCommodities.forEach((c) => {
        newBrokerage[c.value] = Number(c.brokerage || 0);
      });

      // Auto-set group if only one company is selected and it has a group
      let autoGroup = formData.group;
      if (selectedCompaniesData.length === 1) {
        const selectedCompany = selectedCompaniesData[0];
        if (selectedCompany?.groupId && selectedCompany?.group) {
          autoGroup = {
            value: String(selectedCompany.groupId),
            label: selectedCompany.group,
          };
        }
      }

      setCommodityOptions(combinedCommodities);
      setConsigneeOptions(combinedConsignees);
      setFormData((prev) => ({
        ...prev,
        company: selectedCompanies,
        group: autoGroup,
        commodity: [],
        consignee: [],
        brokerage: newBrokerage,
      }));
      return;
    }

    if (fieldName === "commodity") {
      const selectedCommodities = selectedOption || [];
      const newBrokerage = { ...formData.brokerage };

      selectedCommodities.forEach((commodity) => {
        if (!newBrokerage[commodity.value]) {
          newBrokerage[commodity.value] = "";
        }
      });

      setFormData({
        ...formData,
        commodity: selectedCommodities,
        brokerage: newBrokerage,
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
          companyIds: Array.isArray(formData.company)
            ? formData.company.map((c) => c.value)
            : formData.company?.value
              ? [formData.company.value]
              : [],
          groupId: formData.group?.value || null,
          commodityIds: formData.commodity.map((item) => item.value),
          consigneeIds: (formData.consignee || []).map((c) => c.value),
          status: formData.status?.value || "Active",
          brokerage: Object.fromEntries(
            Object.entries(formData.brokerage).map(([key, value]) => [
              key,
              Number(value),
            ]),
          ),
        };

        await axios.post("/buyers", payload);
        setSuccessMessage("Buyer added successfully!");
        setFormData({
          name: "",
          mobile: [""],
          email: [""],
          group: null,
          company: [],
          password: "",
          commodity: [],
          brokerage: {},
          status: "",
          consignee: [],
        });
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        setSuccessMessage("");
        toast.error(error?.response?.data?.message || "Failed to add buyer. Please try again.");
      }
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={buyerLabels.title}
        subtitle="Create a new buyer with company, group, and commodity access"
        icon={FaUserPlus}
        noContentCard
      >
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl mx-auto p-4 sm:p-8 border border-amber-200/80 rounded-2xl shadow-lg bg-white">
              {successMessage && (
                <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 text-center font-semibold animate-fade-in">
                  {successMessage}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="name">
                {buyerLabels.title_name}
              </label>
              <DataInput
                name="name"
                placeholder="Enter Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            {/* Company Name */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="companyName">
                {buyerLabels.company_name_title}
              </label>
              <DataDropdown
                name="company"
                options={companyOptions}
                selectedOptions={formData.company}
                onChange={(selected) =>
                  handleDropdownChange(selected, { name: "company" })
                }
                placeholder="Select Company Name"
                isMulti
                className="w-full"
              />
            </div>
            {/* Group */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="group">
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
                className="w-full"
              />
            </div>
            {/* Password */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="password">
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
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {/* Mobile Numbers */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium">
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
                    className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  {formData.mobile.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField("mobile", index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddField("mobile")}
                className="text-blue-600 flex items-center mt-2 hover:underline"
              >
                <FaPlus className="mr-1" /> {buyerLabels.add_mobile}
              </button>
              {errors.mobile && (
                <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
              )}
            </div>
            {/* Emails */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium">
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
                    className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  {formData.email.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField("email", index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddField("email")}
                className="text-blue-600 flex items-center mt-2 hover:underline"
              >
                <FaPlus className="mr-1" /> {buyerLabels.add_email}
              </button>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            {/* Commodity & Brokerage */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="commodity">
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
                className="w-full"
              />
              {formData.commodity.map((commodity) => (
                <div key={commodity.value} className="mt-4">
                  <label className="block text-gray-700 mb-2">
                    {buyerLabels.brokerage_per_ton_title} {commodity.label}
                  </label>
                  <DataInput
                    name={`brokerage-${commodity.value}`}
                    placeholder={`Brokerage for ${commodity.label}`}
                    value={formData.brokerage[commodity.value]}
                    inputType="number"
                    readOnly
                    className="w-full rounded-lg border-gray-300 bg-gray-100"
                  />
                </div>
              ))}
            </div>
            {/* Consignee */}
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="consignee">
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
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-gray-800 mb-2 font-medium" htmlFor="status">
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
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <Buttons
              label="Submit"
              type="submit"
              variant="primary"
              size="md"
              className="px-8 py-2 rounded-lg shadow-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            />
          </div>
        </form>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddBuyer;
