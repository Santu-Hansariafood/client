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
  const getCommodityName = useCallback((commodity) => {
    if (typeof commodity === "string") return commodity;
    if (!commodity || typeof commodity !== "object") return "";
    return commodity.name || commodity.label || commodity.value || "";
  }, []);

  const getParameterId = useCallback((param) => {
    if (!param || typeof param !== "object") return "";
    return (
      param._id ||
      param.id ||
      param.parameterId ||
      param.parameter?._id ||
      param.parameter?.value ||
      ""
    );
  }, []);

  const getParameterLabel = useCallback((param) => {
    if (!param || typeof param !== "object") return "";
    const rawLabel = param.parameter;

    if (typeof rawLabel === "string") return rawLabel;
    if (rawLabel && typeof rawLabel === "object") {
      return rawLabel.label || rawLabel.name || rawLabel.value || "";
    }

    return param.label || param.name || "";
  }, []);

  const [commodities, setCommodities] = useState(buyerCommodity || []);
  const [parameters, setParameters] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  useEffect(() => {
    if (buyerCommodity) {
      setCommodities(buyerCommodity);
    }
  }, [buyerCommodity]);

  useEffect(() => {
    const currentCommodityName = getCommodityName(formData.commodity);

    if (
      Array.isArray(commodities) &&
      commodities.length > 0 &&
      currentCommodityName
    ) {
      const commodityTemplate = commodities.find(
        (item) => getCommodityName(item) === currentCommodityName,
      );

      if (commodityTemplate) {
        if (selectedCommodity !== currentCommodityName) {
          setSelectedCommodity(currentCommodityName);
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
            (p) => String(getParameterId(p)) === String(getParameterId(templateParam)),
          );
          return {
            ...templateParam,
            parameter: getParameterLabel(templateParam),
            value: savedParam ? savedParam.value : (templateParam.value || ""),
          };
        });

        // Only update state if data has actually changed to prevent re-render loops
        const currentParamsStr = JSON.stringify(
          parameters.map((p) => ({
            id: getParameterId(p),
            label: getParameterLabel(p),
            val: p.value,
          })),
        );
        const nextParamsStr = JSON.stringify(
          mergedParams.map((p) => ({
            id: getParameterId(p),
            label: getParameterLabel(p),
            val: p.value,
          })),
        );

        if (currentParamsStr !== nextParamsStr) {
          setParameters(mergedParams);
        }
      }
    } else if (!formData.commodity && parameters.length > 0) {
      setParameters([]);
      setSelectedCommodity(null);
    }
  }, [
    commodities,
    formData.commodity,
    formData.parameters,
    getCommodityName,
    getParameterId,
    getParameterLabel,
    parameters,
    selectedCommodity,
  ]);

  const onCommodityChange = (option) => {
    const commodityName = getCommodityName(option) || null;
    setSelectedCommodity(commodityName);

    if (commodityName) {
      const commodity = commodities.find(
        (item) => getCommodityName(item) === commodityName,
      );
      const updatedParameters = (commodity?.parameters || []).map((p) => ({
        ...p,
        parameter: getParameterLabel(p),
        value: p.value || "",
      }));

      setParameters(updatedParameters);

      handleChange("commodity", commodityName);
      handleChange(
        "parameters",
        updatedParameters.map((p) => ({
          id: getParameterId(p),
          value: p.value,
        })),
      );

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
          id: getParameterId(param),
          value: param.value,
        }));

        handleChange("parameters", parametersWithIdAndValue);
      }
    },
    [getParameterId, parameters, handleChange],
  );

  const commodityOptions = useMemo(
    () =>
      commodities.map((commodity) => ({
        value: getCommodityName(commodity),
        label: getCommodityName(commodity),
      })),
    [commodities, getCommodityName],
  );

  const headers = useMemo(() => ["Quality Parameter", "Value in %"], []);

  const rows = useMemo(
    () =>
      parameters.map((param, index) => [
        getParameterLabel(param),
        <DataInput
          key={getParameterId(param) || `${getParameterLabel(param)}-${index}`}
          value={param.value}
          placeholder={`Enter value for ${getParameterLabel(param)}`}
          onChange={(e) => onParameterChange(index, e.target.value)}
        />,
      ]),
    [getParameterId, getParameterLabel, parameters, onParameterChange],
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
