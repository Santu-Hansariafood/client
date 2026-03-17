import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUserTie } from "react-icons/fa";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const DropdownSelector = lazy(
  () => import("../../../common/DropdownSelector/DropdownSelector"),
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const AddSellerDetails = () => {
  const [sellerName, setSellerName] = useState("");
  const [password, setPassword] = useState("");

  const [phoneNumbers, setPhoneNumbers] = useState([
    { id: Date.now(), value: "" },
  ]);

  const [emails, setEmails] = useState([{ id: Date.now(), value: "" }]);

  const [commodityOptions, setCommodityOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);

  const [selectedCommodity, setSelectedCommodity] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState([]);
  const [selectedBuyers, setSelectedBuyers] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [brokerageAmounts, setBrokerageAmounts] = useState({});

  const apiBaseURL = "";

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commoditiesRes, companiesRes, buyersRes] = await Promise.all([
          axios.get("/commodities"),
          axios.get("/seller-company"),
          axios.get("/buyers"),
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
          value: item._id,
          label: item.name,
        }));

        setCommodityOptions(
          commodities.sort((a, b) => a.label.localeCompare(b.label)),
        );

        setCompanyOptions(
          companies.sort((a, b) => a.label.localeCompare(b.label)),
        );

        setBuyerOptions(buyers.sort((a, b) => a.label.localeCompare(b.label)));
      } catch (error) {
        toast.error("Failed to load data from server.");
      }
    };

    fetchData();
  }, []);

  const handleCommodityChange = (selected) => {
    setSelectedCommodity(selected || []);
  };

  const handleBrokerageChange = (commodity, value) => {
    setBrokerageAmounts((prev) => ({
      ...prev,
      [commodity]: value,
    }));
  };

  const addPhoneNumber = () => {
    setPhoneNumbers((prev) => [...prev, { id: Date.now(), value: "" }]);
  };

  const removePhoneNumber = (id) => {
    setPhoneNumbers((prev) => prev.filter((phone) => phone.id !== id));
  };

  const handlePhoneChange = (id, value) => {
    setPhoneNumbers((prev) =>
      prev.map((phone) => (phone.id === id ? { ...phone, value } : phone)),
    );
  };

  const addEmail = () => {
    setEmails((prev) => [...prev, { id: Date.now(), value: "" }]);
  };

  const removeEmail = (id) => {
    setEmails((prev) => prev.filter((email) => email.id !== id));
  };

  const handleEmailChange = (id, value) => {
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, value } : email)),
    );
  };

  const handleCompanyChange = (selected) => {
    setSelectedCompany(selected || []);
  };

  const handleSubmit = async () => {
    if (!sellerName || !password) {
      toast.error("Seller name and password required.");
      return;
    }

    if (phoneNumbers.some((p) => !p.value) || emails.some((e) => !e.value)) {
      toast.error("Fill all phone numbers and emails.");
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
      sellerName,
      password,
      phoneNumbers: phoneNumbers.map((phone) => ({
        value: phone.value,
      })),
      emails: emails.map((email) => ({
        value: email.value,
      })),
      commodities: selectedCommodity.map((c) => ({
        name: c.value,
        brokerage: brokerageAmounts[c.value] || 0,
      })),
      companies: selectedCompany.map((c) => c.value),
      status: selectedStatus?.value,
      buyers: selectedBuyers.map((b) => ({
        name: b.label,
      })),
    };

    try {
      await axios.post(`${apiBaseURL}/sellers`, payload);

      toast.success("Seller added successfully");

      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting form");
    }
  };

  const resetForm = () => {
    setSellerName("");
    setPassword("");

    setPhoneNumbers([{ id: Date.now(), value: "" }]);
    setEmails([{ id: Date.now(), value: "" }]);

    setSelectedCommodity([]);
    setSelectedCompany([]);
    setSelectedBuyers([]);

    setBrokerageAmounts({});
    setSelectedStatus(null);
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add Seller Details"
        subtitle="Create a seller user with contact details, commodities, and buyer access"
        icon={FaUserTie}
        noContentCard
      >
        <div className="max-w-5xl mx-auto">
          <div className="w-full bg-white rounded-2xl border border-amber-200/60 shadow-lg p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Seller name
                </label>
                <DataInput
                  placeholder="Enter seller name"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Password
                </label>
                <DataInput
                  placeholder="Enter password"
                  inputType="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {phoneNumbers.map((phone, index) => (
              <div key={phone.id} className="flex items-center gap-3 mt-4">
                <DataInput
                  placeholder={`Phone ${index + 1}`}
                  value={phone.value}
                  inputType="number"
                  onChange={(e) => handlePhoneChange(phone.id, e.target.value)}
                />

                {index === phoneNumbers.length - 1 && (
                  <FaPlusCircle
                    onClick={addPhoneNumber}
                    className="text-green-500 cursor-pointer"
                  />
                )}

                {index > 0 && (
                  <FaMinusCircle
                    onClick={() => removePhoneNumber(phone.id)}
                    className="text-red-500 cursor-pointer"
                  />
                )}
              </div>
            ))}

            {emails.map((email, index) => (
              <div key={email.id} className="flex items-center gap-3 mt-3">
                <DataInput
                  placeholder={`Email ${index + 1}`}
                  value={email.value}
                  onChange={(e) => handleEmailChange(email.id, e.target.value)}
                />

                {index === emails.length - 1 && (
                  <FaPlusCircle
                    onClick={addEmail}
                    className="text-green-500 cursor-pointer"
                  />
                )}

                {index > 0 && (
                  <FaMinusCircle
                    onClick={() => removeEmail(email.id)}
                    className="text-red-500 cursor-pointer"
                  />
                )}
              </div>
            ))}

            <div className="mt-4">
              <DataDropdown
                options={commodityOptions}
                value={selectedCommodity}
                isMulti
                placeholder="Select Commodities"
                onChange={handleCommodityChange}
              />
            </div>

            {selectedCommodity.map((c) => (
              <div key={c.value} className="mt-3">
                <DataInput
                  placeholder={`Brokerage for ${c.label}`}
                  value={brokerageAmounts[c.value] || ""}
                  onChange={(e) =>
                    handleBrokerageChange(c.value, e.target.value)
                  }
                />
              </div>
            ))}

            <div className="mt-4">
              <DataDropdown
                options={companyOptions}
                value={selectedCompany}
                isMulti
                placeholder="Select Companies"
                onChange={handleCompanyChange}
              />
            </div>

            <div className="mt-4">
              <DropdownSelector
                options={buyerOptions}
                value={selectedBuyers}
                isMulti
                placeholder="Select Buyers"
                onChange={(selected) => setSelectedBuyers(selected || [])}
              />
            </div>

            <div className="mt-4">
              <DataDropdown
                options={statusOptions}
                value={selectedStatus}
                placeholder="Select Status"
                onChange={(selected) => setSelectedStatus(selected)}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Buttons
                label="Submit"
                onClick={handleSubmit}
                variant="primary"
                size="lg"
              />
            </div>
          </div>

          <ToastContainer />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddSellerDetails;
