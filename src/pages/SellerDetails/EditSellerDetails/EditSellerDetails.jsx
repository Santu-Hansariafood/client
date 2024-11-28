import { useState, useEffect } from "react";
import axios from "axios";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";
import { ToastContainer, toast } from "react-toastify";
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const EditSellerDetails = ({ seller, onClose, onUpdate }) => {
  const [sellerName, setSellerName] = useState(seller.sellerName || "");
  const [phoneNumbers, setPhoneNumbers] = useState(
    seller.phoneNumbers.map((phone) => ({ id: phone._id, value: phone.value }))
  );
  const [emails, setEmails] = useState(
    seller.emails.map((email) => ({ id: email._id, value: email.value }))
  );
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(
    seller.commodities.map((commodity) => ({
      value: commodity.name,
      label: commodity.name,
      brokerage: commodity.brokerage,
    }))
  );
  const [brokerageAmounts, setBrokerageAmounts] = useState(
    seller.commodities.reduce((acc, commodity) => {
      acc[commodity.name] = commodity.brokerage;
      return acc;
    }, {})
  );
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(
    seller.selectedCompany.map((company) => ({
      value: company.value,
      label: company.label,
    }))
  );
  const [selectedStatus, setSelectedStatus] = useState({
    value: seller.selectedStatus,
    label: seller.selectedStatus,
  });

  const apiBaseURL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [commoditiesRes, companiesRes] = await Promise.all([
          axios.get(`${apiBaseURL}/commodities`),
          axios.get(`${apiBaseURL}/seller-company`),
        ]);

        const commodities = commoditiesRes.data.map((item) => ({
          value: item.name,
          label: item.name,
        }));

        const companies = companiesRes.data.data.map((item) => ({
          value: item.companyName,
          label: item.companyName,
        }));

        setCommodityOptions(commodities);
        setCompanyOptions(companies);
      } catch (error) {
        toast.error("Failed to load dropdown options.");
      }
    };

    fetchOptions();
  }, []);

  const handleSubmit = async () => {
    if (!sellerName) {
      toast.error("Seller Name is required.");
      return;
    }

    if (phoneNumbers.some((phone) => !phone.value)) {
      toast.error("All phone numbers must be filled.");
      return;
    }

    if (emails.some((email) => !email.value)) {
      toast.error("All emails must be filled.");
      return;
    }

    const payload = {
      sellerName,
      phoneNumbers: phoneNumbers.map((phone) => ({ value: phone.value })),
      emails: emails.map((email) => ({ value: email.value })),
      commodities: selectedCommodity.map((commodity) => ({
        name: commodity.value,
        brokerage: brokerageAmounts[commodity.value] || 0,
      })),
      selectedCompany: selectedCompany.map((company) => ({
        value: company.value,
        label: company.label,
      })),
      selectedStatus: selectedStatus?.value,
    };

    try {
      const response = await axios.put(
        `${apiBaseURL}/sellers/${seller._id}`,
        payload
      );
      toast.success("Seller details updated successfully!");
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred while updating."
      );
    }
  };

  const handleAddField = (state, setState) =>
    setState([...state, { id: Date.now(), value: "" }]);

  const handleRemoveField = (state, setState, id) =>
    setState(state.filter((item) => item.id !== id));

  const handleFieldChange = (state, setState, id, value) =>
    setState(
      state.map((item) => (item.id === id ? { ...item, value } : item))
    );

  const handleBrokerageChange = (commodity, value) =>
    setBrokerageAmounts({ ...brokerageAmounts, [commodity]: value });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 max-w-4xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6">Edit Seller Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Seller Name
            </label>
            <DataInput
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Enter Seller Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Numbers
            </label>
            {phoneNumbers.map((phone, index) => (
              <div key={phone.id} className="flex items-center mb-2">
                <DataInput
                  value={phone.value}
                  onChange={(e) =>
                    handleFieldChange(phoneNumbers, setPhoneNumbers, phone.id, e.target.value)
                  }
                  placeholder={`Phone ${index + 1}`}
                  className="flex-1"
                />
                {index > 0 && (
                  <button
                    onClick={() =>
                      handleRemoveField(phoneNumbers, setPhoneNumbers, phone.id)
                    }
                    className="ml-2 text-red-500"
                  >
                    <FaMinusCircle />
                  </button>
                )}
                {index === phoneNumbers.length - 1 && (
                  <button
                    onClick={() =>
                      handleAddField(phoneNumbers, setPhoneNumbers)
                    }
                    className="ml-2 text-green-500"
                  >
                    <FaPlusCircle />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Emails
            </label>
            {emails.map((email, index) => (
              <div key={email.id} className="flex items-center mb-2">
                <DataInput
                  value={email.value}
                  onChange={(e) =>
                    handleFieldChange(emails, setEmails, email.id, e.target.value)
                  }
                  placeholder={`Email ${index + 1}`}
                  className="flex-1"
                />
                {index > 0 && (
                  <button
                    onClick={() =>
                      handleRemoveField(emails, setEmails, email.id)
                    }
                    className="ml-2 text-red-500"
                  >
                    <FaMinusCircle />
                  </button>
                )}
                {index === emails.length - 1 && (
                  <button
                    onClick={() => handleAddField(emails, setEmails)}
                    className="ml-2 text-green-500"
                  >
                    <FaPlusCircle />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Commodities
            </label>
            <DataDropdown
              options={commodityOptions}
              value={selectedCommodity}
              onChange={setSelectedCommodity}
              isMulti
            />
            {selectedCommodity.map((commodity) => (
              <div key={commodity.value} className="mt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brokerage for {commodity.label}
                </label>
                <DataInput
                  value={brokerageAmounts[commodity.value] || ""}
                  onChange={(e) =>
                    handleBrokerageChange(commodity.value, e.target.value)
                  }
                  placeholder="Enter Brokerage"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <div className="w-full md:w-5/12">
              <label className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <DataDropdown
                options={companyOptions}
                value={selectedCompany}
                onChange={setSelectedCompany}
                isMulti
              />
            </div>
            <div className="w-full md:w-5/12">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <DataDropdown
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Buttons
            text="Cancel"
            onClick={onClose}
            className="mr-4 bg-gray-500"
          />
          <Buttons text="Update" onClick={handleSubmit} className="bg-blue-500" />
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default EditSellerDetails;
