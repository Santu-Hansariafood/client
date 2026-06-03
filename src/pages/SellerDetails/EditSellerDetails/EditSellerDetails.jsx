import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { toast } from "react-toastify";
import {
  FaPlusCircle,
  FaMinusCircle,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaBox,
  FaBuilding,
  FaLayerGroup,
  FaInfoCircle,
} from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EditSellerDetails = ({ sellerId: propSellerId, onClose, onSave, isPopup = false }) => {
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
          fetchAllPages("/seller-company").catch(() => []),
          fetchAllPages("/groups").catch(() => []),
          api.get(`/sellers/${sellerId}`),
        ]);

        const sellerData = sellerRes.data?.data || sellerRes.data || {};

        // 1. Set Options First
        const commOpts = (commodities || [])
          .map((item) => ({
            value: item.name || item,
            label: item.name || item,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        const compOpts = (companies || [])
          .map((item) => ({
            value: item.companyName || item.name || item,
            label: item.companyName || item.name || item,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        const grpOpts = (groups || [])
          .map((item) => ({
            value: item._id || item.id || item,
            label: item.groupName || item.name || item,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCommodityOptions(commOpts);
        setCompanyOptions(compOpts);
        setGroupOptions(grpOpts);

        // 2. Set Seller Data
        setFullSellerData(sellerData);
        setSellerName(sellerData.sellerName || "");
        setPassword(sellerData.password || "");
        
        const fetchedPhones = (sellerData.phoneNumbers || []).map((phone) => ({
          id: Math.random(),
          value: phone.value || "",
        }));
        setPhoneNumbers(fetchedPhones.length > 0 ? fetchedPhones : [{ id: Date.now(), value: "" }]);

        const fetchedEmails = (sellerData.emails || []).map((email) => ({
          id: Math.random(),
          value: email.value || "",
        }));
        setEmails(fetchedEmails.length > 0 ? fetchedEmails : [{ id: Date.now(), value: "" }]);

        // Map selected values
        const selectedCommNames = (sellerData.commodities || []).map(
          (c) => c.name || c,
        );
        setSelectedCommodity(selectedCommNames);

        setBrokerageAmounts(
          (sellerData.commodities || []).reduce(
            (acc, c) => ({
              ...acc,
              [c.name || c]: c.brokerage || 0,
            }),
            {},
          ),
        );

        const selectedCompNames = (sellerData.companies || []).map(
          (c) => c.companyName || c.name || c,
        );
        setSelectedCompany(selectedCompNames);

        const selectedGroupIds = (sellerData.groups || [])
          .map((g) => {
            const gName = g.name || g.groupName || g;
            const match = grpOpts.find(
              (opt) => opt.label === gName || opt.value === (g._id || g),
            );
            return match ? match.value : null;
          })
          .filter(Boolean);
        setSelectedGroups(selectedGroupIds);

        setSelectedStatus(sellerData.status || "active");
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
    setSelectedCommodity(selected ? selected.map((s) => s.value) : []);
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
    setSelectedCompany(selected ? selected.map((s) => s.value) : []);
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
        .map((commodityName) => ({
          name: commodityName,
          brokerage: brokerageAmounts[commodityName] || 0,
        })),
      companies: selectedCompany,
      status:
        typeof selectedStatus === "string"
          ? selectedStatus
          : selectedStatus?.value,
      groups: (Array.isArray(selectedGroups) ? selectedGroups : [selectedGroups])
        .filter(Boolean)
        .map((groupId) => {
          const group = groupOptions.find((g) => g.value === groupId);
          return { name: group?.label || groupId };
        }),
    };

    try {
      const response = await api.put(`/sellers/${sellerId}`, payload);
      toast.success("Seller details updated successfully!");
      if (onSave) {
        onSave(response.data);
      }
      if (onClose) {
        onClose();
      } else {
        navigate("/seller-details/list");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "An error occurred while updating the form.",
      );
    }
  };

  if (loading) return <Loading />;

  const formContent = (
    <div className={`${isPopup ? "" : "max-w-5xl mx-auto"}`}>
      <div className={`w-full bg-white rounded-2xl ${isPopup ? "" : "border border-amber-200/60 shadow-lg p-4 sm:p-6 md:p-8"}`}>
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-700">
              Seller Name
            </label>
            <DataInput
              placeholder="Enter seller name"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              required
              maxLength="50"
              icon={FaUserTie}
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
              icon={FaInfoCircle}
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FaPhone className="text-amber-500" /> Contact Details
          </h3>

          <div className="space-y-4">
            {phoneNumbers.map((phone, index) => (
              <div key={phone.id} className="flex items-center gap-3">
                <DataInput
                  placeholder={`Phone Number ${index + 1}`}
                  value={phone.value}
                  inputType="number"
                  onChange={(e) => handlePhoneChange(phone.id, e.target.value)}
                />
                <div className="flex items-center gap-2">
                  {index === phoneNumbers.length - 1 && (
                    <FaPlusCircle
                      onClick={addPhoneNumber}
                      className="text-green-500 cursor-pointer text-xl hover:scale-110 transition-transform"
                    />
                  )}
                  {index > 0 && (
                    <FaMinusCircle
                      onClick={() => removePhoneNumber(phone.id)}
                      className="text-red-500 cursor-pointer text-xl hover:scale-110 transition-transform"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 mt-4">
            {emails.map((email, index) => (
              <div key={email.id} className="flex items-center gap-3">
                <DataInput
                  placeholder={`Email ${index + 1}`}
                  value={email.value}
                  onChange={(e) => handleEmailChange(email.id, e.target.value)}
                  icon={FaEnvelope}
                />
                <div className="flex items-center gap-2">
                  {index === emails.length - 1 && (
                    <FaPlusCircle
                      onClick={addEmail}
                      className="text-green-500 cursor-pointer text-xl hover:scale-110 transition-transform"
                    />
                  )}
                  {index > 0 && (
                    <FaMinusCircle
                      onClick={() => removeEmail(email.id)}
                      className="text-red-500 cursor-pointer text-xl hover:scale-110 transition-transform"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commodities */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FaBox className="text-amber-500" /> Commodities & Brokerage
          </h3>
          <DataDropdown
            options={commodityOptions}
            placeholder="Select commodities"
            selectedOptions={selectedCommodity}
            onChange={handleCommodityChange}
            isMulti={true}
            label="Assigned Commodities"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {(Array.isArray(selectedCommodity)
              ? selectedCommodity
              : [selectedCommodity]
            )
              .filter(Boolean)
              .map((commodityValue) => {
                const commodityLabel =
                  commodityOptions.find((o) => o.value === commodityValue)
                    ?.label || commodityValue;
                return (
                  <div key={commodityValue} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="block mb-2 text-xs font-bold text-slate-500 uppercase">
                      Brokerage (Tons) - {commodityLabel}
                    </label>
                    <DataInput
                      placeholder="0.00"
                      inputType="number"
                      value={brokerageAmounts[commodityValue] || ""}
                      onChange={(e) =>
                        handleBrokerageChange(commodityValue, e.target.value)
                      }
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Associations */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FaBuilding className="text-amber-500" /> Associations & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DataDropdown
              options={companyOptions}
              placeholder="Select companies"
              selectedOptions={selectedCompany}
              onChange={handleCompanyChange}
              isMulti={true}
              label="Seller Company"
            />
            <DataDropdown
              options={statusOptions}
              placeholder="Select status"
              selectedOptions={selectedStatus}
              onChange={(selected) =>
                setSelectedStatus(selected?.value || selected)
              }
              label="Account Status"
            />
          </div>
          <div className="mt-5">
            <DataDropdown
              options={groupOptions}
              placeholder="Select groups"
              isMulti={true}
              selectedOptions={selectedGroups}
              onChange={(selected) =>
                setSelectedGroups(selected ? selected.map((s) => s.value) : [])
              }
              label="Assigned Groups"
            />
          </div>
        </div>

        <div className={`mt-10 flex justify-end gap-3 ${isPopup ? "" : "border-t pt-8"}`}>
          <Buttons
            label="Cancel"
            onClick={onClose || (() => navigate("/seller-details/list"))}
            variant="secondary"
            size="lg"
          />
          <Buttons
            label="Update Seller"
            onClick={handleSubmit}
            type="submit"
            variant="primary"
            size="lg"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<Loading />}>
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
    </Suspense>
  );
};

EditSellerDetails.propTypes = {
  sellerId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  isPopup: PropTypes.bool,
};

export default EditSellerDetails;
