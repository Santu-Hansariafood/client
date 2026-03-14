import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(() =>
  import("../../common/DataDropdown/DataDropdown")
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const Tables = lazy(() => import("../../common/Tables/Tables"));

const CommodityInformation = ({
  handleChange,
  selectedCompany,
  brokerageMap,
  formData,
}) => {
  const [commodities, setCommodities] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const { data } = await axios.get("/companies");
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

    if (selectedCompany) {
      fetchCommodities();
    } else {
      setCommodities([]);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (commodities.length > 0 && formData.commodity && !selectedCommodity) {
      setSelectedCommodity(formData.commodity);
      const commodity = commodities.find((item) => item.name === formData.commodity);
      if (commodity) {
        setParameters(commodity.parameters || []);
      }
    }
  }, [commodities, formData.commodity, selectedCommodity]);

  const onCommodityChange = (option) => {
    const commodityName = option?.value || null;
    setSelectedCommodity(commodityName);

    if (commodityName) {
      const commodity = commodities.find((item) => item.name === commodityName);
      const updatedParameters = commodity?.parameters || [];

      const rawBrokerage = brokerageMap ? brokerageMap[commodityName] : undefined;
      const updatedBrokerage =
        typeof rawBrokerage === "number" && !Number.isNaN(rawBrokerage)
          ? rawBrokerage
          : 0;

      const companyData = commodities.find(
        (commodity) => commodity.companyName === selectedCompany
      );
      const companyEmail = companyData?.companyEmail || "";

      setParameters(updatedParameters);

      handleChange("commodity", commodityName);
      handleChange("parameters", updatedParameters);
      handleChange("companyEmail", companyEmail);
      handleChange("buyerEmails", [companyEmail]);
    } else {
      setParameters([]);
      handleChange("commodity", "");
      handleChange("parameters", []);
      handleChange("companyEmail", "");
      handleChange("buyerEmails", []);
    }
  };

  const onParameterChange = useCallback(
    (index, newValue) => {
      const updatedParameters = [...parameters];
      updatedParameters[index].value = newValue;

      const parametersWithIdAndValue = updatedParameters.map((param) => ({
        id: param._id,
        value: param.value,
      }));

      handleChange("parameters", parametersWithIdAndValue);
    },
    [parameters, handleChange]
  );

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
    [parameters, onParameterChange]
  );

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Commodity Information
      </label>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Select Commodity
          </label>
          <DataDropdown
            placeholder="Select Commodity"
            options={commodityOptions}
            selectedOptions={
              commodityOptions.find(
                ({ value }) => value === selectedCommodity
              ) || null
            }
            onChange={onCommodityChange}
          />
        </div>
        {parameters.length > 0 && (
          <div className="mt-4">
            <label className="block mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Quality Parameters
            </label>
            <Tables headers={headers} rows={rows} />
          </div>
        )}
      </div>
    </Suspense>
  );
};

CommodityInformation.propTypes = {
  handleChange: PropTypes.func.isRequired,
  selectedCompany: PropTypes.string,
  brokerageMap: PropTypes.object,
  buyerCommodity: PropTypes.array.isRequired,
  formData: PropTypes.object.isRequired,
};

export default CommodityInformation;
