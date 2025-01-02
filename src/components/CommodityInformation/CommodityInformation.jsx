import { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import DataDropdown from "../../common/DataDropdown/DataDropdown";
import DataInput from "../../common/DataInput/DataInput";
import Tables from "../../common/Tables/Tables";

const CommodityInformation = ({
  handleChange,
  selectedCompany,
  buyerCommodity,
}) => {
  const [commodities, setCommodities] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [brokerage, setBrokerage] = useState({});
  const [buyers, setBuyers] = useState([]);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/companies");
        const companyData = data.find(
          (company) => company.companyName === selectedCompany
        );

        if (companyData) {
          setCommodities(companyData.commodities || []);
        } else {
          setCommodities([]);
        }
      } catch (error) {
        console.error("Error fetching commodities:", error);
        setCommodities([]);
      }
    };

    const fetchBuyers = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/buyers");
        setBuyers(data || []);
      } catch (error) {
        console.error("Error fetching buyers:", error);
        setBuyers([]);
      }
    };

    if (selectedCompany) {
      fetchCommodities();
      fetchBuyers();
    } else {
      setCommodities([]);
      setBuyers([]);
    }
  }, [selectedCompany]);

  const onCommodityChange = (option) => {
    const commodityName = option?.value || null;
    setSelectedCommodity(commodityName);
  
    if (commodityName) {
      const commodity = commodities.find((item) => item.name === commodityName);
      const updatedParameters = commodity?.parameters || [];
  
      const matchingBuyer = buyers.find(
        (buyer) =>
          buyer.companyName === selectedCompany &&
          buyer.commodity.includes(commodityName)
      );
      const updatedBrokerage = matchingBuyer?.brokerage[commodityName] || "N/A";
  
      const companyData = commodities.find(
        (commodity) => commodity.companyName === selectedCompany
      );
      const companyEmail = companyData?.companyEmail || "";
  
      setParameters(updatedParameters);
      setBrokerage({ [commodityName]: updatedBrokerage });
  
      handleChange("commodity", commodityName);
      handleChange("parameters", updatedParameters);
      handleChange("buyerBrokerage", {
        brokerageBuyer: updatedBrokerage,
      });
      handleChange("companyEmail", companyEmail);
      handleChange("buyerEmails", [companyEmail]);
    } else {
      setParameters([]);
      setBrokerage({});
      handleChange("commodity", "");
      handleChange("parameters", []);
      handleChange("buyerBrokerage", {
        brokerageBuyer: "",
      });
      handleChange("companyEmail", "");
      handleChange("buyerEmails", []);
    }
  };
  
  const onParameterChange = (index, newValue) => {
    const updatedParameters = [...parameters];
    updatedParameters[index].value = newValue;
    setParameters(updatedParameters);
    handleChange("parameters", updatedParameters);
  };

  const commodityOptions = useMemo(
    () =>
      commodities.map((commodity) => ({
        value: commodity.name,
        label: commodity.name,
      })),
    [commodities]
  );

  const headers = useMemo(() => ["Quality Parameter", "Value in %"], []);

  const rows = useMemo(
    () =>
      parameters.map((param, index) => [
        param.parameter,
        <DataInput
          key={param._id}
          value={param.value}
          placeholder={`Enter value for ${param.parameter}`}
          onChange={(e) => onParameterChange(index, e.target.value)}
        />,
      ]),
    [parameters]
  );

  return (
    <div>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Commodity Information
      </label>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Select Commodity
          </label>
          <DataDropdown
            placeholder="Select Commodity"
            options={commodityOptions}
            onChange={onCommodityChange}
            value={
              commodityOptions.find(
                ({ value }) => value === selectedCommodity
              ) || null
            }
            isDisabled={!selectedCompany}
          />
        </div>
        {parameters.length > 0 && (
          <div className="mt-4">
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Parameters
            </label>
            <Tables headers={headers} rows={rows} />
          </div>
        )}
      </div>
    </div>
  );
};

CommodityInformation.propTypes = {
  handleChange: PropTypes.func.isRequired,
  selectedCompany: PropTypes.string.isRequired,
  buyerCommodity: PropTypes.array.isRequired,
};

export default CommodityInformation;
