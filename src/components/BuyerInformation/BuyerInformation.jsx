import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));

const BuyerInformation = ({ formData, handleChange }) => {
  const [buyers, setBuyers] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const selectedBuyer = useMemo(
    () => buyers.find(({ _id }) => _id === selectedCompany),
    [buyers, selectedCompany]
  );

  const selectedConsigneeData = useMemo(
    () => consignees.find(({ _id }) => String(_id) === String(selectedConsignee)),
    [consignees, selectedConsignee]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [buyersRes, consigneesRes] = await Promise.all([
          axios.get("/buyers"),
          axios.get("/consignees"),
        ]);
        setBuyers(buyersRes.data);
        setConsignees(consigneesRes.data?.data || consigneesRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        (formData.buyerCompany || "").trim().toLowerCase(),
    );
    if (match) {
      setSelectedCompany(match._id);
      const consigneeId =
        formData.consignee?._id ||
        formData.consignee?.value ||
        formData.consignee;
      if (consigneeId) setSelectedConsignee(String(consigneeId));

      const rawEmails = match?.email;
      const buyerEmails = Array.isArray(rawEmails)
        ? rawEmails
            .map((e) =>
              typeof e === "string" ? e : (e?.value ?? e?.email ?? ""),
            )
            .filter(Boolean)
        : [];

      if (
        !formData.buyerBrokerage ||
        Object.keys(formData.buyerBrokerage).length === 0 ||
        (formData.buyerBrokerage.brokerageBuyer === 0 &&
          formData.buyerBrokerage.brokerageSupplier === 0)
      ) {
        handleChange(
          "buyerBrokerageMap",
          match.brokerageByName || match.brokerage || {},
        );
      } else {
        handleChange(
          "buyerBrokerageMap",
          match.brokerageByName || match.brokerage || {},
        );
      }

      setInitialized(true);
    }
  }, [
    buyers,
    loading,
    formData?.buyerCompany,
    formData?.consignee,
    initialized,
  ]);

  const companyOptions = useMemo(
    () =>
      buyers.map(({ _id, companyName }) => ({
        value: _id,
        label: companyName,
      })),
    [buyers],
  );

  const consigneeOptions = useMemo(() => {
    return (
      selectedBuyer?.consignee?.map(({ value, label }) => ({ value, label })) ||
      []
    );
  }, [selectedBuyer]);

  const onCompanyChange = (option) => {
    const companyId = option?.value || null;
    setSelectedCompany(companyId);

    const buyerData = buyers.find(({ _id }) => _id === companyId) || {};

    const rawEmails = buyerData?.email;
    const buyerEmails = Array.isArray(rawEmails)
      ? rawEmails
          .map((e) =>
            typeof e === "string" ? e : (e?.value ?? e?.email ?? ""),
          )
          .filter(Boolean)
      : [];
    const firstEmail = buyerEmails[0] || "";
    const firstMobile = Array.isArray(buyerData.mobile) ? buyerData.mobile[0] : (buyerData.mobile || "");
    handleChange("buyer", buyerData.name || "");
    handleChange("companyId", buyerData.companyId || null);
    handleChange("buyerCompany", buyerData.companyName || "");
    handleChange("location", buyerData.location || "");
    handleChange("state", buyerData.state || "");
    handleChange("district", buyerData.district || "");
    handleChange("pinCode", buyerData.pinCode || "");
    handleChange("gstNumber", buyerData.gstNumber || "");
    handleChange("panNumber", buyerData.panNumber || "");
    handleChange("buyerEmail", firstEmail);
    handleChange("buyerMobile", firstMobile);
    handleChange("buyerEmails", buyerEmails.length ? buyerEmails : [""]);
    handleChange("buyerCommodity", buyerData.commodity || []);
    handleChange(
      "buyerBrokerageMap",
      buyerData.brokerageByName || buyerData.brokerage || {},
    );
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

          {selectedBuyer && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
                <span className="text-sm font-bold text-slate-800">
                  Buyer Name (Debitor)
                </span>
                <span className="text-sm font-medium text-emerald-600">
                  {selectedBuyer.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-500">Location</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedBuyer.location || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500">State / District</p>
                  <p className="font-semibold text-slate-700">
                    {selectedBuyer.state || "N/A"} /{" "}
                    {selectedBuyer.district || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">GST Number</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedBuyer.gstNumber || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500">PAN Number</p>
                  <p className="font-semibold text-slate-700 uppercase">
                    {selectedBuyer.panNumber || "N/A"}
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
