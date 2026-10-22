import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaCubes, FaArrowLeft } from "react-icons/fa";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import ScrollToTop from "../../../common/ScrollToTop/ScrollToTop";
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
      clearApiCache();
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
      <ScrollToTop />
      <AdminPageShell
        title="Edit Commodity"
        subtitle="Update commodity with HSN code and quality parameters"
        icon={FaCubes}
        noContentCard
      >
        {isFetching ? (
            <Loading />
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            <div className="lux-card lux-gold-top p-4 sm:p-6 lg:p-8 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Buttons
                  label="Back"
                  onClick={() => navigate("/commodity/list")}
                  variant="secondary"
                  size="sm"
                  icon={<FaArrowLeft />}
                  className="mr-4"
                />
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-lux-ink">
                  Edit Commodity
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
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
                className="mt-4 flex items-center gap-2 font-semibold text-lux-emerald hover:text-lux-deep"
              >
                <AiOutlinePlus size={20} />
                <span className="font-medium">Add Quality Parameter</span>
              </button>

              {extraFields.map((field, index) => (
                <div
                  key={index}
                  className="mt-4 grid grid-cols-1 gap-4 items-center rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:grid-cols-3"
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
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-600"
                    >
                      <AiOutlineMinus size={20} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
