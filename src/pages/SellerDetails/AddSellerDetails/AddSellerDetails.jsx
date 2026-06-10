import { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { ToastContainer, toast } from "react-toastify";
import {
  FaPlusCircle,
  FaMinusCircle,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaBox,
  FaBuilding,
  FaLayerGroup,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";

const AddSellerDetails = () => {
  const [loading, setLoading] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [password, setPassword] = useState("");

  const [phoneNumbers, setPhoneNumbers] = useState([
    { id: Date.now(), value: "" },
  ]);

  const [emails, setEmails] = useState([{ id: Date.now(), value: "" }]);

  const [commodityOptions, setCommodityOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);

  const [selectedCommodity, setSelectedCommodity] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("active");

  const [brokerageAmounts, setBrokerageAmounts] = useState({});

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [commodities, companies, groups] = await Promise.all([
          fetchAllPages("/commodities").catch(() => []),
          fetchAllPages("/seller-company").catch(() => []),
          fetchAllPages("/groups").catch(() => []),
        ]);

        const commodityOpts = commodities.map((item) => ({
          value: item.name || item,
          label: item.name || item,
        }));

        const companyOpts = companies.map((item) => {
          const name = item.companyName || item.name || (typeof item === 'string' ? item : '');
          return {
            value: name,
            label: name,
          };
        }).filter(opt => opt.value);

        const groupOpts = groups.map((item) => ({
          value: item._id || item.id || item,
          label: item.groupName || item.name || item,
        }));

        setCommodityOptions(commodityOpts);
        setCompanyOptions(companyOpts);
        setGroupOptions(groupOpts);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load some data from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCommodityChange = (selected) => {
    setSelectedCommodity(selected ? selected.map((s) => s.value) : []);
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
    setSelectedCompany(selected ? selected.map((s) => s.value) : []);
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
      commodities: selectedCommodity.map((commodityName) => ({
        name: commodityName,
        brokerage: brokerageAmounts[commodityName] || 0,
      })),
      companies: selectedCompany,
      status: typeof selectedStatus === "string" ? selectedStatus : selectedStatus?.value,
      groups: selectedGroups.map((groupId) => {
        const group = groupOptions.find((g) => g.value === groupId);
        return { name: group?.label || groupId };
      }),
    };

    try {
      setLoading(true);
      await api.post("/sellers", payload);
      toast.success("Seller added successfully");
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSellerName("");
    setPassword("");
    setPhoneNumbers([{ id: Date.now(), value: "" }]);
    setEmails([{ id: Date.now(), value: "" }]);
    setSelectedCommodity([]);
    setSelectedCompany([]);
    setSelectedGroups([]);
    setBrokerageAmounts({});
    setSelectedStatus("active");
  };

  if (loading && commodityOptions.length === 0) return <Loading />;

  return (
    <AdminPageShell
      title="Add Seller Details"
      subtitle="Create a seller user with contact details, commodities, and buyer access"
      icon={FaUserTie}
      noContentCard
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all hover:shadow-2xl">
          <div className="p-6 sm:p-10 space-y-10">
            {/* Basic Info Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-sm">1</div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DataInput
                  label="Seller Name"
                  placeholder="Enter full name"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  required
                />
                <DataInput
                  label="Password"
                  placeholder="Create secure password"
                  inputType="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </section>

            {/* Contact Details Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Contact Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Numbers</label>
                  {phoneNumbers.map((phone, index) => (
                    <div key={phone.id} className="flex items-center gap-3 group">
                      <div className="flex-1">
                        <DataInput
                          placeholder={`Phone ${index + 1}`}
                          value={phone.value}
                          inputType="number"
                          onChange={(e) => handlePhoneChange(phone.id, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {index === phoneNumbers.length - 1 && (
                          <button
                            type="button"
                            onClick={addPhoneNumber}
                            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <FaPlusCircle />
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removePhoneNumber(phone.id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                          >
                            <FaMinusCircle />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Email Addresses</label>
                  {emails.map((email, index) => (
                    <div key={email.id} className="flex items-center gap-3 group">
                      <div className="flex-1">
                        <DataInput
                          placeholder={`Email ${index + 1}`}
                          value={email.value}
                          onChange={(e) => handleEmailChange(email.id, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {index === emails.length - 1 && (
                          <button
                            type="button"
                            onClick={addEmail}
                            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <FaPlusCircle />
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(email.id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                          >
                            <FaMinusCircle />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Commodities Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">3</div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Commodities & Brokerage</h4>
              </div>
              <div className="space-y-6">
                <DataDropdown
                  label="Select Commodities"
                  options={commodityOptions}
                  selectedOptions={selectedCommodity}
                  isMulti
                  placeholder="Search and select commodities"
                  onChange={handleCommodityChange}
                />

                {selectedCommodity.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    {selectedCommodity.map((commodityValue) => {
                      const commodityLabel = commodityOptions.find(o => o.value === commodityValue)?.label || commodityValue;
                      return (
                        <div key={commodityValue} className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Brokerage for {commodityLabel}
                          </label>
                          <DataInput
                            placeholder="0.00"
                            inputType="number"
                            value={brokerageAmounts[commodityValue] || ""}
                            onChange={(e) => handleBrokerageChange(commodityValue, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Business Associations Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">4</div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Business Associations & Status</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DataDropdown
                  label="Seller Companies"
                  options={companyOptions}
                  selectedOptions={selectedCompany}
                  isMulti
                  placeholder="Select associated companies"
                  onChange={handleCompanyChange}
                />
                <DataDropdown
                  label="Groups"
                  options={groupOptions}
                  selectedOptions={selectedGroups}
                  isMulti
                  placeholder="Select group associations"
                  onChange={(selected) => setSelectedGroups(selected ? selected.map(s => s.value) : [])}
                />
                <DataDropdown
                  label="Account Status"
                  options={statusOptions}
                  selectedOptions={selectedStatus}
                  placeholder="Select initial status"
                  onChange={(selected) => setSelectedStatus(selected?.value || selected)}
                />
              </div>
            </section>

            {/* Submit Section */}
            <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
              <Buttons
                label="Reset Form"
                onClick={resetForm}
                variant="ghost"
                icon={<FaTimes />}
              />
              <Buttons
                label={loading ? "Saving..." : "Create Seller Account"}
                onClick={handleSubmit}
                variant="primary"
                size="lg"
                icon={<FaSave />}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="colored" />
    </AdminPageShell>
  );
};

export default AddSellerDetails;
