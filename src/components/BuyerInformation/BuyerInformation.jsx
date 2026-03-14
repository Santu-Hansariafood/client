import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(() =>
  import("../../common/DataDropdown/DataDropdown")
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));

const BuyerInformation = ({ formData, handleChange }) => {
  const [buyers, setBuyers] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchBuyers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/buyers");
        setBuyers(data);
      } catch (error) {
        console.error("Error fetching buyers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuyers();
  }, []);

  const orderId = formData?._id;

  useEffect(() => {
    if (orderId) setInitialized(false);
  }, [orderId]);

  useEffect(() => {
    if (loading || initialized || !formData?.buyerCompany) return;
    const match = (Array.isArray(buyers) ? buyers : []).find(
      (b) =>
        (b.companyName || "").trim().toLowerCase() ===
        (formData.buyerCompany || "").trim().toLowerCase()
    );
    if (match) {
      setSelectedCompany(match._id);
      const consigneeId =
        formData.consignee?._id || formData.consignee?.value || formData.consignee;
      if (consigneeId) setSelectedConsignee(String(consigneeId));
      
      const rawEmails = match?.email;
      const buyerEmails = Array.isArray(rawEmails)
        ? rawEmails.map((e) => (typeof e === "string" ? e : e?.value ?? e?.email ?? "")).filter(Boolean)
        : [];
      
      if (!formData.buyerBrokerage || Object.keys(formData.buyerBrokerage).length === 0 || (formData.buyerBrokerage.brokerageBuyer === 0 && formData.buyerBrokerage.brokerageSupplier === 0)) {
         handleChange("buyerBrokerageMap", match.brokerageByName || match.brokerage || {});
      } else {
        handleChange("buyerBrokerageMap", match.brokerageByName || match.brokerage || {});
      }

      setInitialized(true);
    }
  }, [buyers, loading, formData?.buyerCompany, formData?.consignee, initialized]);

  const companyOptions = useMemo(
    () =>
      buyers.map(({ _id, companyName }) => ({
        value: _id,
        label: companyName,
      })),
    [buyers]
  );

  const consigneeOptions = useMemo(() => {
    const selectedBuyer = buyers.find(({ _id }) => _id === selectedCompany);
    return (
      selectedBuyer?.consignee?.map(({ value, label }) => ({ value, label })) ||
      []
    );
  }, [selectedCompany, buyers]);

  const onCompanyChange = (option) => {
    const companyId = option?.value || null;
    setSelectedCompany(companyId);

    const selectedBuyer = buyers.find(({ _id }) => _id === companyId) || {};

    const rawEmails = selectedBuyer?.email;
    const buyerEmails = Array.isArray(rawEmails)
      ? rawEmails.map((e) => (typeof e === "string" ? e : e?.value ?? e?.email ?? "")).filter(Boolean)
      : [];
    const firstEmail = buyerEmails[0] || "";
    handleChange("buyer", selectedBuyer.name || "");
    handleChange("buyerCompany", selectedBuyer.companyName || "");
    handleChange("buyerEmail", firstEmail);
    handleChange("buyerEmails", buyerEmails.length ? buyerEmails : [""]);
    handleChange("buyerCommodity", selectedBuyer.commodity || []);
    handleChange("buyerBrokerageMap", selectedBuyer.brokerageByName || selectedBuyer.brokerage || {});
    setSelectedConsignee("");
    handleChange("consignee", "");
  };

  const onConsigneeChange = (option) => {
    const consigneeValue = option?.label || "";
    setSelectedConsignee(option?.value || "");
    handleChange("consignee", consigneeValue);
  };

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Buyer Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Select Company
          </label>
          <DataDropdown
            placeholder="Select Company"
            options={companyOptions}
            selectedOptions={
              companyOptions.find(({ value }) => value === selectedCompany) ||
              null
            }
            onChange={onCompanyChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Consignee</label>
          <DataDropdown
            placeholder="Select Consignee"
            options={consigneeOptions}
            selectedOptions={
              consigneeOptions.find(
                ({ value }) => value === selectedConsignee
              ) || null
            }
            onChange={onConsigneeChange}
          />
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
