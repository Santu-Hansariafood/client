import { useState, useEffect, lazy, Suspense } from "react";
import api from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { toast } from "react-toastify";
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const apiBaseURL = "";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EditSellerDetails = ({ sellerId, onClose, onSave }) => {
  const [sellerName, setSellerName] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState([
    { id: Date.now(), value: "" },
  ]);
  const [emails, setEmails] = useState([{ id: Date.now(), value: "" }]);
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState([]);
  const [brokerageAmounts, setBrokerageAmounts] = useState({});
  const [selectedCompany, setSelectedCompany] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [fullSellerData, setFullSellerData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commodities, companies, groups, sellerData] = await Promise.all([
          fetchAllPages("/commodities"),
          fetchAllPages("/seller-company"),
          fetchAllPages("/groups"),
          api
            .get(`/sellers/${sellerId}`)
            .then((res) => res.data?.data || res.data || {}),
        ]);

        const commodityOpts = commodities.map((item) => ({
          value: item.name,
          label: item.name,
        }));

        const companyOpts = companies.map((item) => ({
          value: item.companyName,
          label: item.companyName,
        }));

        const groupOpts = groups.map((item) => ({
          value: item._id,
          label: item.groupName,
        }));

        setFullSellerData(sellerData);
        setSellerName(sellerData.sellerName || "");
        setPassword(sellerData.password || "");
        setPhoneNumbers(
          (sellerData.phoneNumbers || []).map((phone) => ({
            id: Date.now() + Math.random(),
            value: phone.value,
          })),
        );
        setEmails(
          (sellerData.emails || []).map((email) => ({
            id: Date.now() + Math.random(),
            value: email.value,
          })),
        );
        setSelectedCommodity(
          (sellerData.commodities || []).map((commodity) => ({
            value: commodity.name,
            label: commodity.name,
          })),
        );
        setBrokerageAmounts(
          (sellerData.commodities || []).reduce(
            (acc, commodity) => ({
              ...acc,
              [commodity.name]: commodity.brokerage,
            }),
            {},
          ),
        );
        setSelectedCompany(
          (sellerData.companies || []).map((company) => ({
            value: company,
            label: company,
          })),
        );
        setSelectedStatus(
          statusOptions.find((option) => option.value === sellerData.status) ||
            null,
        );

        setCommodityOptions(
          commodityOpts.sort((a, b) => a.label.localeCompare(b.label)),
        );
        setCompanyOptions(
          companyOpts.sort((a, b) => a.label.localeCompare(b.label)),
        );
        setGroupOptions(
          groupOpts.sort((a, b) => a.label.localeCompare(b.label)),
        );

        const selectedGroupValues = (sellerData.groups || [])
          .map((group) => group.name)
          .filter(Boolean);

        setSelectedGroups(
          groupOpts.filter((g) => selectedGroupValues.includes(g.label)),
        );
      } catch (error) {
        toast.error("Failed to load data from the server.", error);
      }
    };

    fetchData();
  }, [sellerId]);

  const handleCommodityChange = (selected) => {
    setSelectedCommodity(selected || []);
  };

  const handleBrokerageChange = (commodity, value) => {
    setBrokerageAmounts({
      ...brokerageAmounts,
      [commodity]: value,
    });
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { id: Date.now(), value: "" }]);
  };

  const removePhoneNumber = (id) => {
    setPhoneNumbers(phoneNumbers.filter((phone) => phone.id !== id));
  };

  const handlePhoneChange = (id, value) => {
    setPhoneNumbers(
      phoneNumbers.map((phone) =>
        phone.id === id ? { ...phone, value } : phone,
      ),
    );
  };

  const addEmail = () => {
    setEmails([...emails, { id: Date.now(), value: "" }]);
  };

  const removeEmail = (id) => {
    setEmails(emails.filter((email) => email.id !== id));
  };

  const handleEmailChange = (id, value) => {
    setEmails(
      emails.map((email) => (email.id === id ? { ...email, value } : email)),
    );
  };

  const handleCompanyChange = (selected) => {
    setSelectedCompany(selected || []);
  };

  const handleSubmit = async () => {
    if (!sellerName) {
      toast.error("Please fill out the Seller Name.");
      return;
    }

    if (
      phoneNumbers.some((phone) => !phone.value) ||
      emails.some((email) => !email.value)
    ) {
      toast.error("Please fill out all phone numbers and email addresses.");
      return;
    }

    if (
      phoneNumbers.some((p) => p.value && !regexPatterns.mobile.test(p.value))
    ) {
      toast.error("Invalid phone number format.");
      return;
    }

    if (emails.some((e) => e.value && !regexPatterns.email.test(e.value))) {
      toast.error("Invalid email format.");
      return;
    }

    const payload = {
      ...fullSellerData,
      sellerName,
      phoneNumbers: phoneNumbers.map((phone) => ({ value: phone.value })),
      emails: emails.map((email) => ({ value: email.value })),
      commodities: selectedCommodity.map((commodity) => ({
        name: commodity.value,
        brokerage: brokerageAmounts[commodity.value] || 0,
      })),
      companies: selectedCompany.map((company) => company.value),
      status: selectedStatus?.value,
      groups: selectedGroups.map((group) => ({
        name: group.label,
      })),
    };

    try {
      const response = await api.put(`/sellers/${sellerId}`, payload);
      toast.success("Seller details updated successfully!");
      if (onSave) {
        onSave(response.data);
      }
      resetForm();
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "An error occurred while updating the form.",
      );
    }
  };

  const resetForm = () => {
    setSellerName("");
    setPassword("");
    setPhoneNumbers([{ id: Date.now(), value: "" }]);
    setEmails([{ id: Date.now(), value: "" }]);
    setSelectedCommodity([]);
    setBrokerageAmounts({});
    setSelectedGroups([]);
    setSelectedCompany([]);
    setSelectedStatus(null);
    setFullSellerData({});
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 sm:p-6 md:p-10 lg:p-16 bg-gray-100 flex justify-center items-center">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">
            Edit Seller Details
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seller Name
            </label>
            <DataInput
              placeholder="Enter seller name"
              name="sellerName"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              required
              maxLength="50"
            />
          </div>
          <h3 className="text-lg font-semibold mb-2">Contact Details</h3>
          {phoneNumbers.map((phone, index) => (
            <div key={phone.id} className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number {index + 1}
                </label>
                <DataInput
                  placeholder="Enter phone number"
                  name={`phoneNumber_${index}`}
                  value={phone.value}
                  onChange={(e) => handlePhoneChange(phone.id, e.target.value)}
                />
              </div>
              <div className="flex items-center">
                {index === phoneNumbers.length - 1 && (
                  <button onClick={addPhoneNumber} className="text-green-500">
                    <FaPlusCircle size={24} />
                  </button>
                )}
                {index > 0 && (
                  <button
                    onClick={() => removePhoneNumber(phone.id)}
                    className="text-red-500 ml-2"
                  >
                    <FaMinusCircle size={24} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {emails.map((email, index) => (
            <div key={email.id} className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email {index + 1}
                </label>
                <DataInput
                  placeholder="Enter email"
                  name={`email_${index}`}
                  value={email.value}
                  onChange={(e) => handleEmailChange(email.id, e.target.value)}
                />
              </div>
              <div className="flex items-center">
                {index === emails.length - 1 && (
                  <button onClick={addEmail} className="text-green-500">
                    <FaPlusCircle size={24} />
                  </button>
                )}
                {index > 0 && (
                  <button
                    onClick={() => removeEmail(email.id)}
                    className="text-red-500 ml-2"
                  >
                    <FaMinusCircle size={24} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <h3 className="text-lg font-semibold mb-2">Commodities</h3>
          <DataDropdown
            options={commodityOptions}
            placeholder="Select commodities"
            selectedOptions={selectedCommodity}
            onChange={handleCommodityChange}
            isMulti
          />
          {selectedCommodity.map((commodity) => (
            <div key={commodity.value} className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brokerage Amount (Tons) for {commodity.label}
              </label>
              <DataInput
                placeholder={`Enter brokerage amount for ${commodity.label}`}
                name={`brokerage_${commodity.value}`}
                value={brokerageAmounts[commodity.value] || ""}
                onChange={(e) =>
                  handleBrokerageChange(commodity.value, e.target.value)
                }
              />
            </div>
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Company
              </label>
              <DataDropdown
                options={companyOptions}
                placeholder="Select companies"
                selectedOptions={selectedCompany}
                onChange={handleCompanyChange}
                isMulti
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <DataDropdown
                options={statusOptions}
                placeholder="Select status"
                selectedOptions={selectedStatus}
                onChange={(selected) => setSelectedStatus(selected)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groups
            </label>
            <DataDropdown
              options={groupOptions}
              placeholder="Select groups"
              isMulti
              selectedOptions={selectedGroups}
              onChange={(selected) => setSelectedGroups(selected || [])}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Buttons
              label="Update"
              onClick={handleSubmit}
              type="submit"
              variant="primary"
              size="lg"
            />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default EditSellerDetails;
