import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import Loading from "../../../common/Loading/Loading";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const EditCommodityPopup = ({ isOpen, onClose, commodityId, onUpdate }) => {
  const [commodityName, setCommodityName] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [extraFields, setExtraFields] = useState([{ parameter: "" }]);
  const [parametersOptions, setParametersOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCommodity = async () => {
      if (!commodityId) return;
      setIsLoading(true);
      try {
        const response = await axios.get(`/commodities/${commodityId}`);
        const data = response.data;
        setCommodityName(data.name);
        setHsnCode(data.hsnCode || "");
        const fields = (data.parameters || []).map((p) => ({
          parameter: { value: p.parameterId || p._id, label: p.parameter },
        }));
        setExtraFields(fields.length > 0 ? fields : [{ parameter: "" }]);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Error fetching commodity",
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchQualityParameters = async () => {
      try {
        const response = await axios.get("/quality-parameters");
        const items = response.data?.data || response.data || [];
        const options = items
          .map((param) => ({ value: param._id, label: param.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setParametersOptions(options);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Error fetching quality parameters",
        );
      }
    };

    if (isOpen) {
      fetchCommodity();
      fetchQualityParameters();
    }
  }, [isOpen, commodityId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "commodityName") setCommodityName(value);
    if (name === "hsnCode") setHsnCode(value);
  };

  const handleAddField = () => {
    setExtraFields([...extraFields, { parameter: "" }]);
  };

  const handleRemoveField = (index) => {
    if (extraFields.length === 1) {
      setExtraFields([{ parameter: "" }]);
    } else {
      setExtraFields(extraFields.filter((_, i) => i !== index));
    }
  };

  const handleExtraFieldChange = (index, name, value) => {
    const newFields = [...extraFields];
    newFields[index][name] = value;
    setExtraFields(newFields);
  };

  const getFilteredOptions = (index) => {
    const selectedParameters = extraFields
      .map((field) => field.parameter?.value)
      .filter(Boolean);
    return parametersOptions.filter(
      (option) =>
        !selectedParameters.includes(option.value) ||
        option.value === extraFields[index]?.parameter?.value,
    );
  };

  const handleSave = async () => {
    if (!commodityName || !hsnCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: commodityName,
        hsnCode,
        parameters: extraFields
          .map((field) => ({
            parameterId: field.parameter?.value,
          }))
          .filter((p) => p.parameterId),
      };
      await axios.put(`/commodities/${commodityId}`, payload);
      onUpdate();
      toast.success("Commodity updated successfully!");
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update commodity. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-2xl p-6 sm:p-8 rounded-2xl shadow-xl border border-amber-200/80">
          <h3 className="text-2xl font-bold mb-8 text-center text-slate-800">
            Edit Commodity
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DataInput
                  placeholder="Enter commodity name"
                  value={commodityName}
                  onChange={handleInputChange}
                  name="commodityName"
                  required
                />
                <DataInput
                  placeholder="Enter HSN code"
                  value={hsnCode}
                  onChange={handleInputChange}
                  name="hsnCode"
                  required
                />
              </div>

              <button
                onClick={handleAddField}
                className="mt-4 text-green-700 flex items-center space-x-2"
              >
                <AiOutlinePlus size={20} />
                <span className="font-medium">Add Quality Parameter</span>
              </button>

              {extraFields.map((field, index) => (
                <div
                  key={index}
                  className="mt-4 grid grid-cols-3 gap-4 items-center bg-gray-50 p-4 rounded-lg shadow-sm"
                >
                  <DataDropdown
                    options={getFilteredOptions(index)}
                    selectedOptions={field.parameter}
                    onChange={(option) =>
                      handleExtraFieldChange(index, "parameter", option)
                    }
                    placeholder="Select Parameter"
                  />
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => handleRemoveField(index)}
                      className="text-red-500 flex items-center space-x-2"
                    >
                      <AiOutlineMinus size={20} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-4 mt-8">
                <Buttons
                  label="Cancel"
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                />
                <Buttons
                  label={isLoading ? "Saving..." : "Save"}
                  onClick={handleSave}
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Suspense>
  );
};

EditCommodityPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  commodityId: PropTypes.string.isRequired,
};

export default EditCommodityPopup;
