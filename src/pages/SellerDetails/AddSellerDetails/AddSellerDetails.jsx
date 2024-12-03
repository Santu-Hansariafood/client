import { useState, useEffect } from "react";
import axios from "axios";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DropdownSelector from "../../../common/DropdownSelector/DropdownSelector";
import Buttons from "../../../common/Buttons/Buttons";
import { ToastContainer, toast } from "react-toastify";
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const AddSellerDetails = () => {
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
  const [selectedBuyers, setSelectedBuyers] = useState([]);

  const apiBaseURL = "http://localhost:5000/api";

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commoditiesRes, companiesRes, buyersRes] = await Promise.all([
          axios.get(`${apiBaseURL}/commodities`),
          axios.get(`${apiBaseURL}/seller-company`),
          axios.get(`${apiBaseURL}/buyers`),
        ]);

        const commodities = commoditiesRes.data.map((item) => ({
          value: item.name,
          label: item.name,
        }));

        const companies = companiesRes.data.data.map((item) => ({
          value: item.companyName,
          label: item.companyName,
        }));

        const buyers = buyersRes.data.map((item) => ({
          value: item.name,
          label: item.name,
        }));

        setCommodityOptions(
          commodities.sort((a, b) => a.label.localeCompare(b.label))
        );
        setCompanyOptions(
          companies.sort((a, b) => a.label.localeCompare(b.label))
        );
        setSelectedBuyers(
          buyers.sort((a, b) => a.label.localeCompare(b.label))
        );
      } catch (error) {
        toast.error("Failed to load data from the server.", error);
      }
    };

    fetchData();
  }, []);

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
        phone.id === id ? { ...phone, value } : phone
      )
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
      emails.map((email) => (email.id === id ? { ...email, value } : email))
    );
  };

  const handleCompanyChange = (selected) => {
    setSelectedCompany(selected || []);
  };

  const handleSubmit = async () => {
    if (!sellerName || !password) {
      toast.error("Please fill out the Seller Name and Password.");
      return;
    }

    if (
      phoneNumbers.some((phone) => !phone.value) ||
      emails.some((email) => !email.value)
    ) {
      toast.error("Please fill out all phone numbers and email addresses.");
      return;
    }

    const payload = {
      sellerName,
      password,
      phoneNumbers: phoneNumbers.map((phone) => ({ value: phone.value })),
      emails: emails.map((email) => ({ value: email.value })),
      commodities: selectedCommodity.map((commodity) => ({
        name: commodity.value,
        brokerage: brokerageAmounts[commodity.value] || 0,
      })),
      companies: selectedCompany.map((company) => ({
        value: company.value,
        label: company.label,
      })),
      selectedStatus: selectedStatus?.value,
      buyers: selectedBuyers.map((buyer) => ({
        name: buyer.value,
      })),
    };

    try {
      const response = await axios.post(`${apiBaseURL}/sellers`, payload);
      toast.success("Seller details submitted successfully!");
      console.log(response);
      resetForm();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "An error occurred while submitting the form."
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
    setSelectedBuyers([]);
    setSelectedCompany([]);
    setSelectedStatus(null);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-16 bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          Add Seller Details
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
          value={selectedCommodity}
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
              value={selectedCompany}
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
              value={selectedStatus}
              onChange={(selected) => setSelectedStatus(selected)}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <DataInput
            placeholder="Enter password"
            name="password"
            inputType="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="4"
            maxLength="25"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buyers
          </label>
          <DropdownSelector
            fetchData={async () => {
              try {
                const buyersRes = await axios.get(`${apiBaseURL}/buyers`);
                return buyersRes.data.map((item) => ({
                  value: item.name,
                  label: item.name,
                }));
              } catch (error) {
                toast.error("Failed to load buyers.");
                return [];
              }
            }}
            options={selectedBuyers}
            placeholder="Select buyers"
            isMulti
            value={selectedBuyers}
            onChange={(selected) => setSelectedBuyers(selected || [])}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Buttons
            label="Submit"
            onClick={handleSubmit}
            type="submit"
            variant="primary"
            size="lg"
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AddSellerDetails;
