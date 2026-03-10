import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);

const EditCompanyPopup = ({ company, isOpen, onClose, onUpdate }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedConsignees, setSelectedConsignees] = useState([]);
  const [commodityEntries, setCommodityEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);

  const [selectedCommodityToAdd, setSelectedCommodityToAdd] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consigneeRes, commodityRes, groupRes] = await Promise.all([
          axios.get("/consignees"),
          axios.get("/commodities"),
          axios.get("/groups"),
        ]);

        const consignees = consigneeRes.data?.data || consigneeRes.data || [];
        const commoditiesData = commodityRes.data?.data || commodityRes.data || [];
        const groups = groupRes.data?.data || groupRes.data || [];

        setConsigneeOptions(
          consignees
            .map((c) => ({ value: String(c._id), label: c.name }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        setGroupOptions(
          groups
            .map((g) => ({ value: String(g._id), label: g.groupName }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );

        const mappedCommodityOptions = commoditiesData
          .map((c) => ({
            value: String(c._id),
            label: c.name,
            parameters: Array.isArray(c.parameters)
              ? c.parameters
                  .map((p) => ({
                    value: String(p.parameterId || p._id || ""),
                    label: p.parameter,
                  }))
                  .filter((p) => p.value && p.label)
              : [],
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCommodityOptions(mappedCommodityOptions);

        if (company) {
          setCompanyName(company.companyName || "");
          setCompanyEmail(company.companyEmail || "");
          setSelectedGroup(
            company.groupId
              ? { value: String(company.groupId), label: company.group || "Select Group" }
              : null
          );
          setSelectedConsignees(
            Array.isArray(company.consigneeIds)
              ? company.consigneeIds.map((id, idx) => ({
                  value: String(id),
                  label: company.consignee?.[idx] || "Consignee",
                }))
              : []
          );

      setCommodityEntries(
        Array.isArray(company.commodities)
          ? company.commodities.map((entry) => ({
              commodityId: String(entry.commodityId || entry._id || ""),
              brokerage: entry.brokerage ?? 0,
              parameters: Array.isArray(entry.parameters)
                ? entry.parameters.map((p) => ({
                    parameterId: String(p.parameterId || p._id || ""),
                    label: p.parameter || "",
                    value: p.value ?? "",
                  }))
                : [],
            }))
          : []
      );
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load required data.");
      }
    };

    if (isOpen) fetchData();
  }, [isOpen, company]);

  if (!isOpen) return null;

  const getCommodityParameterOptions = (commodityId) => {
    const commodity = commodityOptions.find((c) => c.value === String(commodityId));
    return commodity?.parameters || [];
  };

  const getCommodityLabel = (commodityId) => {
    const commodity = commodityOptions.find((c) => c.value === String(commodityId));
    return commodity?.label || "";
  };

  const handleAddCommodity = () => {
    if (!selectedCommodityToAdd?.value) {
      toast.error("Please select a commodity to add.");
      return;
    }

    const commodityId = String(selectedCommodityToAdd.value);
    if (commodityEntries.some((e) => e.commodityId === commodityId)) {
      toast.warning("Commodity already added.");
      return;
    }

    setCommodityEntries((prev) => [
      ...prev,
      {
        commodityId,
        brokerage: 0,
        parameters: getCommodityParameterOptions(commodityId).map((p) => ({
          parameterId: String(p.value),
          label: p.label,
          value: "",
        })),
      },
    ]);
    setSelectedCommodityToAdd(null);
  };

  const handleRemoveCommodity = (index) => {
    setCommodityEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParameterSelectionChange = (commodityIndex, selectedOptions) => {
    setCommodityEntries((prev) => {
      const updated = [...prev];
      const current = updated[commodityIndex];
      const existingById = new Map(
        (current.parameters || []).map((p) => [String(p.parameterId), p])
      );
      const nextParams = (selectedOptions || []).map((opt) => {
        const existing = existingById.get(String(opt.value));
        return {
          parameterId: String(opt.value),
          label: opt.label,
          value: existing?.value ?? "",
        };
      });
      updated[commodityIndex] = { ...current, parameters: nextParams };
      return updated;
    });
  };

  const handleParameterValueChange = (commodityIndex, parameterIndex, value) => {
    setCommodityEntries((prev) => {
      const updated = [...prev];
      const current = updated[commodityIndex];
      const params = [...(current.parameters || [])];
      params[parameterIndex] = { ...params[parameterIndex], value };
      updated[commodityIndex] = { ...current, parameters: params };
      return updated;
    });
  };

  const handleBrokerageChange = (commodityIndex, value) => {
    setCommodityEntries((prev) => {
      const updated = [...prev];
      updated[commodityIndex] = { ...updated[commodityIndex], brokerage: Number(value || 0) };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        companyName,
        companyEmail,
        groupId: selectedGroup?.value || null,
        consigneeIds: selectedConsignees.map((c) => c.value),
        commodities: commodityEntries.map((entry) => ({
          commodityId: entry.commodityId,
          brokerage: Number(entry.brokerage || 0),
          parameters: (entry.parameters || [])
            .map((p) => ({ parameterId: p.parameterId, value: p.value }))
            .filter((p) => p.parameterId),
        })),
      };

      const response = await axios.put(`/companies/${company._id}`, payload);
      onUpdate(response.data);
      toast.success("Company updated successfully.");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update company.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-full sm:w-3/4 lg:w-2/3 max-h-screen overflow-auto relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>
          <h2 className="text-2xl font-bold mb-4 text-center">
            Edit Company Details
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <DataInput
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  name="companyName"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Email
                </label>
                <DataInput
                  placeholder="Company Email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  name="companyEmail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Group
                </label>
                <DataDropdown
                  options={groupOptions}
                  selectedOptions={selectedGroup}
                  onChange={(opt) => setSelectedGroup(opt)}
                  placeholder="Select Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Consignees
                </label>
                <DataDropdown
                  options={consigneeOptions}
                  selectedOptions={selectedConsignees}
                  isMulti
                  onChange={(opts) => setSelectedConsignees(opts || [])}
                  placeholder="Select Consignees"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Commodities
                </label>
                <div className="flex items-center gap-2">
                  <DataDropdown
                    options={commodityOptions.filter(
                      (opt) =>
                        !commodityEntries.some(
                          (entry) => entry.commodityId === opt.value
                        )
                    )}
                    selectedOptions={selectedCommodityToAdd}
                    onChange={(option) => setSelectedCommodityToAdd(option)}
                    placeholder="Select Commodity"
                  />
                  <button
                    type="button"
                    onClick={handleAddCommodity}
                    className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition"
                  >
                    Add
                  </button>
                </div>

                {commodityEntries.map((entry, commodityIndex) => (
                  <div
                    key={commodityIndex}
                    className="border p-4 mt-2 rounded relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveCommodity(commodityIndex)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      title="Remove Commodity"
                    >
                      ✖
                    </button>
                    <label className="block mt-2 font-semibold">Brokerage</label>
                    <DataInput
                      placeholder="Enter Brokerage"
                      value={entry.brokerage}
                      onChange={(e) =>
                        handleBrokerageChange(commodityIndex, e.target.value)
                      }
                    />
                    <p className="font-semibold">{getCommodityLabel(entry.commodityId)}</p>
                    <label className="block mt-2 font-semibold">
                      Quality Parameters
                    </label>
                    <DataDropdown
                      options={getCommodityParameterOptions(entry.commodityId)}
                      selectedOptions={(entry.parameters || []).map((p) => ({
                        value: p.parameterId,
                        label: p.label,
                      }))}
                      isMulti
                      onChange={(selectedOptions) =>
                        handleParameterSelectionChange(commodityIndex, selectedOptions)
                      }
                      placeholder="Select Quality Parameters"
                    />
                    {(entry.parameters || []).map((param, paramIndex) => (
                      <div
                        key={paramIndex}
                        className="flex items-center gap-4 mt-2"
                      >
                        <p className="flex-1">{param.label}</p>
                        <DataInput
                          placeholder="Value"
                          value={param.value || ""}
                          onChange={(e) =>
                            handleParameterValueChange(
                              commodityIndex,
                              paramIndex,
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-green-500 text-white px-4 py-2 rounded ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </Suspense>
  );
};

EditCompanyPopup.propTypes = {
  company: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditCompanyPopup;
