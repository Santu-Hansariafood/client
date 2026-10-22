import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { ToastContainer, toast } from "react-toastify";
import {
  FaPlusCircle,
  FaMinusCircle,
  FaUserTie,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const normalizeAssociationName = (value) =>
  String(value ?? "").trim().toLowerCase();

const EditSellerDetails = ({
  sellerId: propSellerId,
  onClose,
  onSave,
  isPopup = false,
}) => {
  const { sellerId: paramSellerId } = useParams();
  const navigate = useNavigate();
  const sellerId = propSellerId || paramSellerId;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [commodities, companies, groups, sellerRes] = await Promise.all([
          fetchAllPages("/commodities").catch(() => []),
          fetchAllPages("/seller-company", {
            params: { dropdown: "true" },
          }).catch(() => []),
          fetchAllPages("/groups").catch(() => []),
          api.get(`/sellers/${sellerId}`),
        ]);

        const sellerData = sellerRes.data?.data || sellerRes.data || {};

        const commOpts = commodities.map((item) => ({
          value: item.name || item,
          label: item.name || item,
        }));

        const compOpts = companies
          .map((item) => {
            const name =
              item.companyName ||
              item.name ||
              (typeof item === "string" ? item : "");
            return {
              value: name,
              label: name,
            };
          })
          .filter((opt) => opt.value);

        const grpOpts = groups.map((item) => ({
          value: item._id || item.id || item,
          label: item.groupName || item.name || item,
        }));

        setCommodityOptions(commOpts);
        setCompanyOptions(compOpts);
        setGroupOptions(grpOpts);

        setFullSellerData(sellerData);
        setSellerName(sellerData.sellerName || "");
        setPassword(sellerData.password || "");

        const fetchedPhones = (sellerData.phoneNumbers || []).map((phone) => ({
          id: Math.random(),
          value: phone.value || "",
        }));
        setPhoneNumbers(
          fetchedPhones.length > 0
            ? fetchedPhones
            : [{ id: Date.now(), value: "" }],
        );

        const fetchedEmails = (sellerData.emails || []).map((email) => ({
          id: Math.random(),
          value: email.value || "",
        }));
        setEmails(
          fetchedEmails.length > 0
            ? fetchedEmails
            : [{ id: Date.now(), value: "" }],
        );

        const selectedCommNames = (sellerData.commodities || []).map(
          (c) => c.name || c,
        );
        const selectedCommoditiesObjs = commOpts.filter(opt => selectedCommNames.includes(opt.value));
        setSelectedCommodity(selectedCommoditiesObjs);

        setBrokerageAmounts(
          (sellerData.commodities || []).reduce(
            (acc, c) => ({
              ...acc,
              [c.name || c]: c.brokerage || 0,
            }),
            {},
          ),
        );

        const selectedCompNames = new Set(
          (sellerData.companies || []).map((c) =>
            normalizeAssociationName(c.companyName || c.name || c),
          ),
        );
        const selectedCompaniesObjs = compOpts.filter((opt) =>
          selectedCompNames.has(normalizeAssociationName(opt.value)),
        );
        setSelectedCompany(selectedCompaniesObjs);

        const selectedGroupsObjs = (sellerData.groups || [])
          .map((group) => {
            const groupName = group.name || group.groupName || group;
            return grpOpts.find(
              (opt) =>
                opt.value === (group._id || group) ||
                normalizeAssociationName(opt.label) ===
                  normalizeAssociationName(groupName),
            );
          })
          .filter(Boolean);
        setSelectedGroups(selectedGroupsObjs);

        const statusObj = statusOptions.find(opt => opt.value === (sellerData.status || "active"));
        setSelectedStatus(statusObj);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load seller data from the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  const handleCommodityChange = useCallback((selected) => {
    setSelectedCommodity(selected || []);
  }, []);

  const handleBrokerageChange = useCallback((commodity, value) => {
    setBrokerageAmounts((prev) => ({
      ...prev,
      [commodity]: value,
    }));
  }, []);

  const addPhoneNumber = useCallback(() => {
    setPhoneNumbers((prev) => [...prev, { id: Date.now(), value: "" }]);
  }, []);

  const removePhoneNumber = useCallback((id) => {
    setPhoneNumbers((prev) => prev.filter((phone) => phone.id !== id));
  }, []);

  const handlePhoneChange = useCallback((id, value) => {
    setPhoneNumbers((prev) =>
      prev.map((phone) => (phone.id === id ? { ...phone, value } : phone)),
    );
  }, []);

  const addEmail = useCallback(() => {
    setEmails((prev) => [...prev, { id: Date.now(), value: "" }]);
  }, []);

  const removeEmail = useCallback((id) => {
    setEmails((prev) => prev.filter((email) => email.id !== id));
  }, []);

  const handleEmailChange = useCallback((id, value) => {
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, value } : email)),
    );
  }, []);

  const handleCompanyChange = useCallback((selected) => {
    setSelectedCompany(selected || []);
  }, []);

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
      password,
      phoneNumbers: phoneNumbers.map((phone) => ({ value: phone.value })),
      emails: emails.map((email) => ({ value: email.value })),
      commodities: (Array.isArray(selectedCommodity)
        ? selectedCommodity
        : [selectedCommodity]
      )
        .filter(Boolean)
        .map((commodityObj) => ({
          name: commodityObj.value,
          brokerage: brokerageAmounts[commodityObj.value] || 0,
        })),
      companies: selectedCompany.map(obj => obj.value),
      status: selectedStatus?.value,
      groups: (Array.isArray(selectedGroups)
        ? selectedGroups
        : [selectedGroups]
      )
        .filter(Boolean)
        .map((groupObj) => {
          return { name: groupObj.label };
        }),
    };

    try {
      setSaving(true);
      const response = await api.put(`/sellers/${sellerId}`, payload);
      clearApiCache();
      toast.success("Seller details updated successfully!");
      if (onSave) {
        onSave(response.data);
      }
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          navigate("/seller-details/list");
        }
      }, 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "An error occurred while updating the form.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const formContent = (
    <div className={`${isPopup ? "" : "mx-auto w-full max-w-5xl space-y-6"}`}>
      <div
        className="lux-card lux-gold-top w-full overflow-hidden p-4 sm:p-6 lg:p-8"
      >
        <div className="space-y-8 sm:space-y-10">
          {/* Basic Info Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#ece4d2] pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                1
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest text-lux-ink">
                Basic Information
              </h4>
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
                placeholder="Update password (optional)"
                inputType="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#ece4d2] pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                2
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest text-lux-ink">
                Contact Details
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted">
                  Phone Numbers
                </label>
                {phoneNumbers.map((phone, index) => (
                  <div key={phone.id} className="flex items-center gap-3 group">
                    <div className="flex-1">
                      <DataInput
                        placeholder={`Phone ${index + 1}`}
                        value={phone.value}
                        inputType="number"
                        onChange={(e) =>
                          handlePhoneChange(phone.id, e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {index === phoneNumbers.length - 1 && (
                        <button
                          type="button"
                          onClick={addPhoneNumber}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-lux-emerald/10 text-lux-emerald shadow-sm transition-all hover:bg-lux-emerald hover:text-lux-gold-soft"
                        >
                          <FaPlusCircle />
                        </button>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removePhoneNumber(phone.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                        >
                          <FaMinusCircle />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted">
                  Email Addresses
                </label>
                {emails.map((email, index) => (
                  <div key={email.id} className="flex items-center gap-3 group">
                    <div className="flex-1">
                      <DataInput
                        placeholder={`Email ${index + 1}`}
                        value={email.value}
                        onChange={(e) =>
                          handleEmailChange(email.id, e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {index === emails.length - 1 && (
                        <button
                          type="button"
                          onClick={addEmail}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-lux-emerald/10 text-lux-emerald shadow-sm transition-all hover:bg-lux-emerald hover:text-lux-gold-soft"
                        >
                          <FaPlusCircle />
                        </button>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeEmail(email.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
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

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#ece4d2] pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                3
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest text-lux-ink">
                Commodities & Brokerage
              </h4>
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
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                  {selectedCommodity.map((commodityObj) => {
                    return (
                      <div key={commodityObj.value} className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                          Brokerage for {commodityObj.label}
                        </label>
                        <DataInput
                          placeholder="0.00"
                          inputType="number"
                          value={brokerageAmounts[commodityObj.value] || ""}
                          onChange={(e) =>
                            handleBrokerageChange(
                              commodityObj.value,
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#ece4d2] pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                4
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest text-lux-ink">
                Business Associations & Status
              </h4>
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
                onChange={(selected) =>
                  setSelectedGroups(selected || [])
                }
              />
              <DataDropdown
                label="Account Status"
                options={statusOptions}
                selectedOptions={selectedStatus}
                placeholder="Select status"
                onChange={(selected) =>
                  setSelectedStatus(selected)
                }
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-[#ece4d2] pt-10 sm:flex-row sm:justify-end">
            <Buttons
              label="Cancel"
              onClick={onClose || (() => navigate("/seller-details/list"))}
              variant="secondary"
              icon={<FaTimes />}
            />
            <Buttons
              label={saving ? "Saving Changes..." : "Update Seller Account"}
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              icon={<FaSave />}
              disabled={saving}
            />
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );

  return (
    <>
      {isPopup ? (
        formContent
      ) : (
        <AdminPageShell
          title="Edit Seller Details"
          subtitle={`Update information for ${sellerName || "Seller"}`}
          icon={FaUserTie}
          noContentCard
        >
          {formContent}
        </AdminPageShell>
      )}
    </>
  );
};

EditSellerDetails.propTypes = {
  sellerId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  isPopup: PropTypes.bool,
};

export default EditSellerDetails;
