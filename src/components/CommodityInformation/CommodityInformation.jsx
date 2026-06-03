import {
  useEffect,
  useState,
  useMemo,
  lazy,
  Suspense,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import api from "../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../utils/apiClient/fetchAllPages";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const Tables = lazy(() => import("../../common/Tables/Tables"));

const CommodityInformation = ({
  handleChange,
  selectedCompany,
  brokerageMap,
  formData,
  buyerCommodity,
}) => {
  const [commodities, setCommodities] = useState(buyerCommodity || []);
  const [parameters, setParameters] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  useEffect(() => {
    if (buyerCommodity) {
      setCommodities(buyerCommodity);
    }
  }, [buyerCommodity]);

  useEffect(() => {
    if (Array.isArray(commodities) && commodities.length > 0 && formData.commodity) {
      const commodityTemplate = commodities.find(
        (item) => item.name === formData.commodity,
      );
      
      if (commodityTemplate) {
        if (selectedCommodity !== formData.commodity) {
          setSelectedCommodity(formData.commodity);
        }
        
        // Merge template with saved values if they exist
        const templateParams = Array.isArray(commodityTemplate.parameters) 
          ? commodityTemplate.parameters 
          : [];
          
        const savedParams = Array.isArray(formData.parameters) 
          ? formData.parameters 
          : [];

        const mergedParams = templateParams.map((templateParam) => {
          const savedParam = savedParams.find(
            (p) => String(p.id || p._id) === String(templateParam._id),
          );
          return {
            ...templateParam,
            value: savedParam ? savedParam.value : (templateParam.value || ""),
          };
        });
        
        // Only update state if data has actually changed to prevent re-render loops
        const currentParamsStr = JSON.stringify(parameters.map(p => ({ id: p._id, val: p.value })));
        const nextParamsStr = JSON.stringify(mergedParams.map(p => ({ id: p._id, val: p.value })));
        
        if (currentParamsStr !== nextParamsStr) {
          setParameters(mergedParams);
        }
      }
    } else if (!formData.commodity && parameters.length > 0) {
      setParameters([]);
      setSelectedCommodity(null);
    }
  }, [commodities, formData.commodity, formData.parameters]);

  const onCommodityChange = (option) => {
    const commodityName = option?.value || null;
    setSelectedCommodity(commodityName);

    if (commodityName) {
      const commodity = commodities.find((item) => item.name === commodityName);
      const updatedParameters = (commodity?.parameters || []).map(p => ({
        ...p,
        value: p.value || ""
      }));

      setParameters(updatedParameters);

      handleChange("commodity", commodityName);
      handleChange("parameters", updatedParameters.map(p => ({
        id: p._id,
        value: p.value
      })));
      
      // Removed the buggy companyData lookup that was clearing emails
    } else {
      setParameters([]);
      handleChange("commodity", "");
      handleChange("parameters", []);
    }
  };

  const onParameterChange = useCallback(
    (index, newValue) => {
      const updatedParameters = [...parameters];
      if (updatedParameters[index]) {
        updatedParameters[index] = { ...updatedParameters[index], value: newValue };
        setParameters(updatedParameters);

        const parametersWithIdAndValue = updatedParameters.map((param) => ({
          id: param._id,
          value: param.value,
        }));

        handleChange("parameters", parametersWithIdAndValue);
      }
    },
    [parameters, handleChange],
  );

  const commodityOptions = useMemo(
    () =>
      commodities.map((commodity) => ({
        value: commodity.name,
        label: commodity.name,
      })),
    [commodities],
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
    [parameters, onParameterChange],
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
                ({ value }) => value === selectedCommodity,
              ) || null
            }
            onChange={onCommodityChange}
            value={selectedCommodity}
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
