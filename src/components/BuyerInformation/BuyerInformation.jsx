import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(() =>
  import("../../common/DataDropdown/DataDropdown")
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));

const BuyerInformation = ({ handleChange }) => {
  const [buyers, setBuyers] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [soudaNo, setSoudaNo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "https://phpserver-kappa.vercel.app/api/buyers"
        );
        setBuyers(data);
      } catch (error) {
        console.error("Error fetching buyers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuyers();
  }, []);

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

    handleChange("buyer", selectedBuyer.name || "");
    handleChange("buyerCompany", selectedBuyer.companyName || "");
    handleChange("buyerEmail", selectedBuyer.email?.[0] || "");
    handleChange("buyerCommodity", selectedBuyer.commodity || []);
    handleChange("buyerBrokerage", selectedBuyer.brokerage || {});
    setSelectedConsignee("");
    handleChange("consignee", "");
  };

  const onConsigneeChange = (option) => {
    const consigneeValue = option?.value || "";
    setSelectedConsignee(consigneeValue);
    handleChange("consignee", consigneeValue);
  };

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Buyer Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Souda No</label>
          <DataInput
            placeholder="System Generated No Input Requird"
            value={soudaNo}
            readOnly
            onChange={(e) => {
              const value = e.target.value;
              setSoudaNo(value);
              handleChange("soudaNo", value);
            }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Select Company
          </label>
          <DataDropdown
            placeholder="Select Company"
            options={companyOptions}
            onChange={onCompanyChange}
            value={
              companyOptions.find(({ value }) => value === selectedCompany) ||
              null
            }
            isLoading={loading}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Consignee</label>
          <DataDropdown
            placeholder="Select Consignee"
            options={consigneeOptions}
            onChange={onConsigneeChange}
            value={
              consigneeOptions.find(
                ({ value }) => value === selectedConsignee
              ) || null
            }
            isDisabled={!selectedCompany}
          />
        </div>
      </div>
    </Suspense>
  );
};

BuyerInformation.propTypes = {
  handleChange: PropTypes.func.isRequired,
};

export default BuyerInformation;
