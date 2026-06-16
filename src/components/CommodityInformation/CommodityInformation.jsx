import {
  useEffect,
  useState,
  useMemo,
  lazy,
  Suspense,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const Tables = lazy(() => import("../../common/Tables/Tables"));

const CommodityInformation = ({
  handleChange,
  formData,
  buyerCommodity,
}) => {
  const getCommodityId = useCallback((commodity) => {
    if (!commodity || typeof commodity !== "object") return "";
    return commodity._id || commodity.commodityId || commodity.value || "";
  }, []);

  const getCommodityName = useCallback((commodity) => {
    if (typeof commodity === "string") return commodity;
    if (!commodity || typeof commodity !== "object") return "";
    return commodity.name || commodity.label || commodity.value || "";
  }, []);

  const getCommodityValue = useCallback(
    (value) => {
      const commodity =
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? value
          : null;

      if (commodity) {
        return getCommodityName(commodity);
      }

      const matchedCommodity = (buyerCommodity || []).find(
        (item) => String(getCommodityId(item)) === String(value),
      );

      return getCommodityName(matchedCommodity) || String(value || "");
    },
    [buyerCommodity, getCommodityId, getCommodityName],
  );

  const [commodities, setCommodities] = useState(buyerCommodity || []);
  const [parameters, setParameters] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  const findCommodity = useCallback(
    (value) => {
      if (!value || !Array.isArray(commodities)) return null;

      const rawValue =
        typeof value === "object"
          ? value._id || value.commodityId || value.value || value.name || value.label
          : value;

      const normalizedValue = String(rawValue);

      return (
        commodities.find(
          (item) => String(getCommodityId(item)) === normalizedValue,
        ) ||
        commodities.find(
          (item) => getCommodityName(item) === normalizedValue,
        ) ||
        null
      );
    },
    [commodities, getCommodityId, getCommodityName],
  );

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

  useEffect(() => {
    if (buyerCommodity) {
      setCommodities(buyerCommodity);
    }
  }, [buyerCommodity]);

  useEffect(() => {
    const commodityTemplate = findCommodity(formData.commodity);

    if (
      Array.isArray(commodities) &&
      commodities.length > 0 &&
      commodityTemplate
    ) {
      const selectedCommodityValue = getCommodityValue(formData.commodity);
      const selectedCommodityId =
        getCommodityId(commodityTemplate) || getCommodityName(commodityTemplate);

      if (selectedCommodity !== selectedCommodityId) {
        setSelectedCommodity(selectedCommodityId);
      }

      if (
        selectedCommodityValue &&
        selectedCommodityValue !== formData.commodity
      ) {
        handleChange("commodity", selectedCommodityValue);
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
        // Get baseValue and maxValue from template values (first element of values array)
        const templateValues = templateParam.values?.[0] || {};
        return {
          ...templateParam,
          parameter: getParameterLabel(templateParam),
          baseValue: savedParam?.baseValue ?? templateValues.baseValue ?? templateParam.value ?? "",
          maxValue: savedParam?.maxValue ?? templateValues.maxValue ?? "",
          value: savedParam?.value ?? templateParam.value ?? "",
        };
      });

      // Only update state if data has actually changed to prevent re-render loops
      const currentParamsStr = JSON.stringify(
        parameters.map((p) => ({
          id: getParameterId(p),
          label: getParameterLabel(p),
          baseVal: p.baseValue,
          maxVal: p.maxValue,
        })),
      );
      const nextParamsStr = JSON.stringify(
        mergedParams.map((p) => ({
          id: getParameterId(p),
          label: getParameterLabel(p),
          baseVal: p.baseValue,
          maxVal: p.maxValue,
        })),
      );

      if (currentParamsStr !== nextParamsStr) {
        setParameters(mergedParams);
      }
    } else if (!formData.commodity && parameters.length > 0) {
      setParameters([]);
      setSelectedCommodity(null);
    }
  }, [
    commodities,
    formData.commodity,
    formData.parameters,
    findCommodity,
    getCommodityId,
    getCommodityName,
    getCommodityValue,
    getParameterId,
    getParameterLabel,
    handleChange,
    parameters,
    selectedCommodity,
  ]);

  const onCommodityChange = (option) => {
    const commodity = findCommodity(option);
    const commodityName = getCommodityName(commodity) || null;
    const commodityId = getCommodityId(commodity) || commodityName;
    setSelectedCommodity(commodityId);

    if (commodityName && commodity) {
      const updatedParameters = (commodity?.parameters || []).map((p) => {
        const templateValues = p.values?.[0] || {};
        return {
          ...p,
          parameter: getParameterLabel(p),
          baseValue: templateValues.baseValue ?? p.value ?? "",
          maxValue: templateValues.maxValue ?? "",
          value: p.value ?? "",
        };
      });

      setParameters(updatedParameters);

      handleChange("commodity", commodityName);
      handleChange(
        "parameters",
        updatedParameters.map((p) => ({
          id: getParameterId(p),
          parameterId: getParameterId(p),
          baseValue: p.baseValue,
          maxValue: p.maxValue,
          value: p.value,
        })),
      );

    } else {
      setParameters([]);
      handleChange("commodity", "");
      handleChange("parameters", []);
    }
  };

  const onParameterChange = useCallback(
    (index, field, newValue) => {
      const updatedParameters = [...parameters];
      if (updatedParameters[index]) {
        updatedParameters[index] = { ...updatedParameters[index], [field]: newValue };
        setParameters(updatedParameters);

        const parametersToSave = updatedParameters.map((param) => ({
          id: getParameterId(param),
          parameterId: getParameterId(param),
          value: param.value,
          baseValue: param.baseValue,
          maxValue: param.maxValue,
        }));

        handleChange("parameters", parametersToSave);
      }
    },
    [getParameterId, parameters, handleChange],
  );

  const commodityOptions = useMemo(
    () =>
      commodities.map((commodity) => ({
        value: getCommodityId(commodity) || getCommodityName(commodity),
        label: getCommodityName(commodity),
      })),
    [commodities, getCommodityId, getCommodityName],
  );

  const headers = useMemo(() => ["Quality Parameter", "Base Value (%)", "Max Value (%)"], []);

  const rows = useMemo(
    () =>
      parameters.map((param, index) => [
        getParameterLabel(param),
        <DataInput
          key={`${getParameterId(param)}-baseValue`}
          value={param.baseValue || param.value || ""}
          placeholder={`Enter base value for ${getParameterLabel(param)}`}
          onChange={(e) => onParameterChange(index, 'baseValue', e.target.value)}
        />,
        <DataInput
          key={`${getParameterId(param)}-maxValue`}
          value={param.maxValue || ""}
          placeholder={`Enter max value for ${getParameterLabel(param)}`}
          onChange={(e) => onParameterChange(index, 'maxValue', e.target.value)}
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
