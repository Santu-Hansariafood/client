import { useEffect, useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes
import axios from "axios";
import { toast } from "react-toastify";
import DataInput from "../../common/DataInput/DataInput";
import DataDropdown from "../../common/DataDropdown/DataDropdown";

const API_URL = "http://localhost:5000/api/agents";

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

  const renderBrokerageField = (label, value) => (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <DataInput
        placeholder={`₹ ${label}`}
        inputType="text"
        value={`₹ ${value || ""}`}
        readOnly
      />
    </div>
  );

  return (
    <div>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Broker Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Broker</label>
          <DataInput
            placeholder="Broker"
            value="Hansaria Food Private Limited"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Agent Name</label>
          {loading ? (
            <p className="text-sm text-gray-500">Loading agents...</p>
          ) : (
            <DataDropdown
              placeholder="Agent Name"
              options={agentOptions}
              onChange={(selectedOption) =>
                handleChange("agentName", selectedOption?.value || "")
              }
              value={formData.agentName}
            />
          )}
        </div>
        {renderBrokerageField(
          "Brokerage Per Ton (Buyer)",
          formData.buyerBrokerage?.brokerageBuyer
        )}
        {renderBrokerageField(
          "Brokerage Per Ton (Supplier)",
          formData.supplierBrokerageDetails?.find(
            (brokerageDetail) => brokerageDetail.name === formData.commodity
          )?.brokerage || "N/A"
        )}
      </div>
    </div>
  );
};

BrokerInformation.propTypes = {
  formData: PropTypes.shape({
    agentName: PropTypes.string,
    buyerBrokerage: PropTypes.shape({
      brokerageBuyer: PropTypes.string,
      brokerageSupplier: PropTypes.string,
    }),
    supplierBrokerageDetails: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        brokerage: PropTypes.string,
      })
    ),
    commodity: PropTypes.string,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};
