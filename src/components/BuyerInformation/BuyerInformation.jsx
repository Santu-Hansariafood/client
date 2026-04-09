import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Loading from "../../common/Loading/Loading";
import { fetchAllPages } from "../../utils/apiClient/fetchAllPages";
import { useAuth } from "../../context/AuthContext/AuthContext";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));

const BuyerInformation = ({
  formData,
  handleChange,
  buyers: propBuyers,
  consignees: propConsignees,
}) => {
  const { userRole, mobile } = useAuth();
  const [buyers, setBuyers] = useState(propBuyers || []);
  const [consignees, setConsignees] = useState(propConsignees || []);
  const [companies, setCompanies] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [loading, setLoading] = useState(!propBuyers || propBuyers.length === 0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (propBuyers?.length > 0) {
      setBuyers(propBuyers);
      setLoading(false);
    }
  }, [propBuyers]);

  useEffect(() => {
    if (propConsignees?.length > 0) setConsignees(propConsignees);
  }, [propConsignees]);

  useEffect(() => {
    const fetchData = async () => {
      if (propBuyers?.length > 0 && propConsignees?.length > 0) {
        // If data is already provided via props, just fetch companies
        try {
          const companiesRows = await fetchAllPages("/companies", { limit: 200 });
          setCompanies(companiesRows);
        } catch (error) {
          console.error("Error fetching companies:", error);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [buyersRows, consigneesRows, companiesRows] = await Promise.all([
          fetchAllPages("/buyers", { limit: 200 }),
          fetchAllPages("/consignees", { limit: 200 }),
          fetchAllPages("/companies", { limit: 200 }),
        ]);
        setBuyers(buyersRows);
        setConsignees(consigneesRows);
        setCompanies(companiesRows);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propBuyers, propConsignees]);

  const selectedBuyer = useMemo(
    () =>
      (Array.isArray(buyers) ? buyers : []).find(
        ({ _id }) => _id === selectedBuyerId,
      ),
    [buyers, selectedBuyerId],
  );

  const selectedCompany = useMemo(
    () =>
      (Array.isArray(companies) ? companies : []).find(
        ({ _id }) => _id === selectedCompanyId,
      ),
    [companies, selectedCompanyId],
  );

  const selectedConsigneeData = useMemo(
    () =>
      (Array.isArray(consignees) ? consignees : []).find(
        ({ _id }) => String(_id) === String(selectedConsignee),
      ),
    [consignees, selectedConsignee],
  );

  // Filter buyers based on role
  const buyerOptions = useMemo(() => {
    let filteredBuyers = Array.isArray(buyers) ? buyers : [];
    if (userRole === "Buyer") {
      filteredBuyers = filteredBuyers.filter((b) =>
        b.mobile?.some((m) => String(m) === String(mobile)),
      );
    }
    return filteredBuyers.map((b) => ({
      value: b._id,
      label: b.name,
    }));
  }, [buyers, userRole, mobile]);

  // Filter companies based on selected buyer
  const companyOptions = useMemo(() => {
    if (!selectedBuyer) return [];
    const linkedCompanyIds = (selectedBuyer.companyIds || []).map((id) =>
      String(id),
    );
    return (Array.isArray(companies) ? companies : [])
      .filter((c) => linkedCompanyIds.includes(String(c._id)))
      .map((c) => ({
        value: c._id,
        label: c.companyName,
      }));
  }, [selectedBuyer, companies]);

  // Handle initial data for editing
  useEffect(() => {
    if (loading || initialized) return;

    const hasEditHints =
      formData?.buyer ||
      formData?.buyerCompany ||
      formData?.companyId != null ||
      formData?.buyerMobile;
    if (!hasEditHints) return;

    const buyerList = Array.isArray(buyers) ? buyers : [];
    const companyList = Array.isArray(companies) ? companies : [];

    const matchCompany =
      companyList.find(
        (c) =>
          formData.companyId != null &&
          String(c._id) === String(formData.companyId),
      ) ||
      companyList.find(
        (c) =>
          (formData.buyerCompany || "").trim() &&
          (c.companyName || "").trim().toLowerCase() ===
            (formData.buyerCompany || "").trim().toLowerCase(),
      );

    let matchBuyer = buyerList.find(
      (b) =>
        b.name === formData.buyer ||
        b.mobile?.some((m) => String(m) === String(formData.buyerMobile)),
    );

    if (!matchBuyer && matchCompany) {
      matchBuyer = buyerList.find((b) =>
        (b.companyIds || []).some(
          (cid) => String(cid) === String(matchCompany._id),
        ),
      );
    }

    if (!matchBuyer) return;

    setSelectedBuyerId(matchBuyer._id);

    if (matchCompany) {
      setSelectedCompanyId(matchCompany._id);
      
      // Auto-trigger onCompanyChange logic to populate parent state
      const buyerData = matchBuyer;
      const companyData = matchCompany;

      const rawEmails = buyerData?.email;
      const buyerEmails = Array.isArray(rawEmails)
        ? rawEmails
            .map((e) => typeof e === "string" ? e : (e?.value ?? e?.email ?? ""))
            .filter(Boolean)
        : [];
      const firstEmail = buyerEmails[0] || "";
      const firstMobile = Array.isArray(buyerData.mobile)
        ? buyerData.mobile[0]
        : buyerData.mobile || "";

      handleChange("companyId", companyData._id);
      handleChange("buyerCompany", companyData.companyName || "");
      handleChange("location", companyData.location || "");
      handleChange("state", companyData.state || "");
      handleChange("district", companyData.district || "");
      handleChange("pinCode", companyData.pinCode || "");
      handleChange("gstNumber", companyData.gstNumber || "");
      handleChange("panNumber", companyData.panNumber || "");
      handleChange("buyerEmail", firstEmail);
      handleChange("buyerMobile", firstMobile);
      handleChange("buyerEmails", buyerEmails.length ? buyerEmails : [""]);
      handleChange("buyerCommodity", companyData.commodities || []);
      handleChange(
        "buyerBrokerageMap",
        buyerData.brokerageByName || buyerData.brokerage || {},
      );
    }

    const consigneeValue =
      formData.consignee?._id ||
      formData.consignee?.value ||
      formData.consignee;

    if (consigneeValue) {
      const found = consignees.find(
        (c) =>
          String(c._id) === String(consigneeValue) ||
          (c.name || c.label) === consigneeValue,
      );
      if (found) {
        setSelectedConsignee(String(found._id));
        handleChange("consignee", found.name || found.label || "");
      }
    }

    setInitialized(true);
  }, [buyers, companies, consignees, loading, formData, initialized, handleChange]);

  const onBuyerChange = (option) => {
    const buyerId = option?.value || null;
    setSelectedBuyerId(buyerId);
    setSelectedCompanyId(null); // Reset company when buyer changes
    handleChange("buyer", option?.label || "");
    handleChange("buyerCompany", "");
    handleChange("companyId", null);
  };

  const onCompanyChange = (option) => {
    const companyId = option?.value || null;
    setSelectedCompanyId(companyId);

    const companyData = companies.find(({ _id }) => _id === companyId) || {};
    const buyerData = selectedBuyer || {};

    const rawEmails = buyerData?.email;
    const buyerEmails = Array.isArray(rawEmails)
      ? rawEmails
          .map((e) =>
            typeof e === "string" ? e : (e?.value ?? e?.email ?? ""),
          )
          .filter(Boolean)
      : [];
    const firstEmail = buyerEmails[0] || "";
    const firstMobile = Array.isArray(buyerData.mobile)
      ? buyerData.mobile[0]
      : buyerData.mobile || "";

    handleChange("companyId", companyId);
    handleChange("buyerCompany", companyData.companyName || "");
    handleChange("location", companyData.location || "");
    handleChange("state", companyData.state || "");
    handleChange("district", companyData.district || "");
    handleChange("pinCode", companyData.pinCode || "");
    handleChange("gstNumber", companyData.gstNumber || "");
    handleChange("panNumber", companyData.panNumber || "");
    handleChange("buyerEmail", firstEmail);
    handleChange("buyerMobile", firstMobile);
    handleChange("buyerEmails", buyerEmails.length ? buyerEmails : [""]);
    handleChange("buyerCommodity", companyData.commodities || []);
    handleChange(
      "buyerBrokerageMap",
      buyerData.brokerageByName || buyerData.brokerage || {},
    );
    setSelectedConsignee("");
    handleChange("consignee", "");
  };

  const consigneeOptions = useMemo(() => {
    if (!selectedCompany) return [];
    const fromCompany =
      selectedCompany?.consigneeIds?.map((id, idx) => {
        const c = consignees.find((con) => String(con._id) === String(id));
        return {
          value: String(id),
          label: c?.name || "Consignee",
        };
      }) || [];
    return fromCompany.sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedCompany, consignees]);

  const onConsigneeChange = (option) => {
    const consigneeValue = option?.label || "";
    setSelectedConsignee(option?.value || "");
    handleChange("consignee", consigneeValue);
    handleChange("billTo", "consignee");
  };

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Buyer Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Select Buyer
          </label>
          <DataDropdown
            placeholder="Select Buyer"
            options={buyerOptions}
            selectedOptions={
              buyerOptions.find(({ value }) => value === selectedBuyerId) ||
              null
            }
            onChange={onBuyerChange}
            value={selectedBuyerId}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Company
            </label>
            <DataDropdown
              placeholder="Select Company"
              options={companyOptions}
              selectedOptions={
                companyOptions.find(({ value }) => value === selectedCompanyId) ||
                null
              }
              onChange={onCompanyChange}
              value={selectedCompanyId}
              disabled={!selectedBuyerId}
            />
          </div>

          {selectedCompany && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
                <span className="text-sm font-bold text-slate-800">
                  Company Details
                </span>
                <span className="text-sm font-medium text-emerald-600">
                  {selectedCompany.companyName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-500">Location</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedCompany.location || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500">State / District</p>
                  <p className="font-semibold text-slate-700">
                    {selectedCompany.state || "N/A"} /{" "}
                    {selectedCompany.district || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">GST Number</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedCompany.gstNumber || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500">PAN Number</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedCompany.panNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Consignee
          </label>
          <DataDropdown
            placeholder="Select Consignee"
            options={consigneeOptions}
            selectedOptions={
              consigneeOptions.find(
                ({ value }) => value === selectedConsignee,
              ) || null
            }
            onChange={onConsigneeChange}
            value={selectedConsignee}
            disabled={!selectedCompanyId}
          />

          {selectedConsigneeData && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100 mb-2">
                <span className="text-sm font-bold text-slate-800">
                  Consignee Details
                </span>
                <span className="text-sm font-medium text-emerald-600">
                  {selectedConsigneeData.phone}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-500">Location</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedConsigneeData.location || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500">State / District</p>
                  <p className="font-semibold text-slate-700">
                    {selectedConsigneeData.state || "N/A"} /{" "}
                    {selectedConsigneeData.district || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">GST Number</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedConsigneeData.gst || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500">PAN Number</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedConsigneeData.pan || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
};

BuyerInformation.propTypes = {
  formData: PropTypes.object,
  handleChange: PropTypes.func.isRequired,
};

export default BuyerInformation;
