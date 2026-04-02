import { lazy, useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);

const API_URL = "/agents";

const BrokerInformation = ({ formData, handleChange }) => {
  const [agentOptions, setAgentOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(API_URL);
        const options = data
          .map(({ name }) => ({
            value: name.toUpperCase(),
            label: name.toUpperCase(),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setAgentOptions(options);
      } catch {
        toast.error("Failed to fetch agents.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const supplierBrokerage = formData.supplierBrokerage?.find(
    (b) => b.name === formData.commodity,
  )?.brokerage;

  const buyerBrokerageVal = formData.buyerBrokerage?.brokerageBuyer;
  const supplierBrokerageVal =
    supplierBrokerage ?? formData.buyerBrokerage?.brokerageSupplier;

  return (
    <>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Broker Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Broker
          </label>
          <DataInput
            placeholder="Broker"
            value="Hansaria Food Private Limited"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Agent Name
          </label>
          {loading ? (
            <p className="text-sm text-slate-500 py-3">Loading agents...</p>
          ) : (
            <DataDropdown
              placeholder="Select Agent"
              options={agentOptions}
              selectedOptions={
                agentOptions.find(
                  (o) => o.value === formData.agentName?.toUpperCase(),
                ) || null
              }
              onChange={(opt) => handleChange("agentName", opt?.value || "")}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Brokerage Per Ton (Buyer)
          </label>
          <DataInput
            placeholder="₹ 0"
            inputType="text"
            value={
              buyerBrokerageVal !== undefined && buyerBrokerageVal !== ""
                ? `₹ ${buyerBrokerageVal}`
                : ""
            }
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Brokerage Per Ton (Supplier)
          </label>
          <DataInput
            placeholder="₹ 0"
            inputType="text"
            value={
              supplierBrokerageVal !== undefined && supplierBrokerageVal !== ""
                ? `₹ ${supplierBrokerageVal}`
                : ""
            }
            readOnly
          />
        </div>
      </div>
    </>
  );
};

BrokerInformation.propTypes = {
  formData: PropTypes.shape({
    agentName: PropTypes.string,
    buyerBrokerage: PropTypes.shape({
      brokerageBuyer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      brokerageSupplier: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    }),
    supplierBrokerage: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        brokerage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
    commodity: PropTypes.string,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default BrokerInformation;
