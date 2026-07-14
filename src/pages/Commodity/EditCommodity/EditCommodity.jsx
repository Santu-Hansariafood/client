import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaCubes, FaArrowLeft } from "react-icons/fa";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import Buttons from "../../../common/Buttons/Buttons";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);

const EditCommodity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [commodityName, setCommodityName] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [extraFields, setExtraFields] = useState([{ parameter: "" }]);
  const [parametersOptions, setParametersOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsFetching(true);
      try {
        const [commodityRes, paramsRes] = await Promise.all([
          api.get(`/commodities/${id}`),
          api.get("/quality-parameters"),
        ]);

        const commodity = commodityRes.data;
        setCommodityName(commodity.name);
        setHsnCode(commodity.hsnCode || "");

        const params = paramsRes.data?.data || paramsRes.data || [];
        const options = params
          .map((param) => ({ value: param._id, label: param.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setParametersOptions(options);

        const existingParams = (commodity.parameters || []).map((p) => ({
          parameter: options.find((opt) => opt.value === p.parameterId) || null,
        }));

        setExtraFields(
          existingParams.length > 0 ? existingParams : [{ parameter: "" }],
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Error fetching commodity details",
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [id]);

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
      const formData = {
        name: commodityName,
        hsnCode,
        parameters: extraFields
          .map((field) => ({
            parameterId: field.parameter?.value,
          }))
          .filter((p) => p.parameterId),
      };
      await api.put(`/commodities/${id}`, formData);
      toast.success("Commodity updated successfully!");
      navigate("/commodity/list");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update commodity",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Edit Commodity"
        subtitle="Update commodity with HSN code and quality parameters"
        icon={FaCubes}
        noContentCard
      >
        {isFetching ? (
          <div className="py-20 flex justify-center">
            <Loading />
          </div>
        ) : (
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-amber-200/80">
              <div className="flex items-center mb-8">
                <Buttons
                  label="Back"
                  onClick={() => navigate("/commodity/list")}
                  variant="secondary"
                  size="sm"
                  icon={<FaArrowLeft />}
                  className="mr-4"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Edit Commodity
                </h2>
              </div>

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
                  onClick={() => navigate("/commodity/list")}
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
            </div>
          </div>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default EditCommodity;
