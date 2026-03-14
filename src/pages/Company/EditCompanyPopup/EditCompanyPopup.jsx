import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

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
        const commoditiesData =
          commodityRes.data?.data || commodityRes.data || [];
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
              ? c.parameters.map((p) => ({
                  value: String(p.parameterId || p._id),
                  label: p.parameter,
                }))
              : [],
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCommodityOptions(mappedCommodityOptions);

        if (company) {
          setCompanyName(company.companyName || "");
          setCompanyEmail(company.companyEmail || "");

          if (company.groupId) {
            const grp = groups.find(
              (g) => String(g._id) === String(company.groupId)
            );
            setSelectedGroup(
              grp ? { value: String(grp._id), label: grp.groupName } : null
            );
          }

          if (Array.isArray(company.consigneeIds)) {
            const mapped = company.consigneeIds
              .map((id) => {
                const c = consignees.find(
                  (x) => String(x._id) === String(id)
                );
                return c ? { value: String(c._id), label: c.name } : null;
              })
              .filter(Boolean);

            setSelectedConsignees(mapped);
          }

          // ✅ IMPORTANT FIX (keeps commodity _id)
          setCommodityEntries(
            Array.isArray(company.commodities)
              ? company.commodities.map((entry) => ({
                  _id: entry._id || null,
                  commodityId: String(entry.commodityId || entry._id || ""),
                  brokerage: entry.brokerage ?? 0,
                  parameters: Array.isArray(entry.parameters)
                    ? entry.parameters.map((p) => ({
                        parameterId: String(p.parameterId || p._id),
                        label: p.parameter,
                        value: p.value ?? "",
                      }))
                    : [],
                }))
              : []
          );
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load required data."
        );
      }
    };

    if (isOpen) fetchData();
  }, [isOpen, company]);

  if (!isOpen) return null;

  const getCommodityParameterOptions = (commodityId) => {
    const commodity = commodityOptions.find(
      (c) => c.value === String(commodityId)
    );
    return commodity?.parameters || [];
  };

  const getCommodityLabel = (commodityId) => {
    const commodity = commodityOptions.find(
      (c) => c.value === String(commodityId)
    );
    return commodity?.label || "";
  };

  const handleAddCommodity = () => {
    if (!selectedCommodityToAdd?.value) {
      toast.error("Please select a commodity.");
      return;
    }

    const commodityId = selectedCommodityToAdd.value;

    if (commodityEntries.some((e) => e.commodityId === commodityId)) {
      toast.warning("Commodity already added.");
      return;
    }

    setCommodityEntries((prev) => [
      ...prev,
      {
        _id: null,
        commodityId,
        brokerage: 0,
        parameters: getCommodityParameterOptions(commodityId).map((p) => ({
          parameterId: p.value,
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

  const handleParameterValueChange = (commodityIndex, parameterIndex, value) => {
    setCommodityEntries((prev) => {
      const updated = [...prev];
      updated[commodityIndex].parameters[parameterIndex].value = value;
      return updated;
    });
  };

  const handleBrokerageChange = (commodityIndex, value) => {
    setCommodityEntries((prev) => {
      const updated = [...prev];
      updated[commodityIndex].brokerage = Number(value || 0);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (companyEmail && !regexPatterns.email.test(companyEmail)) {
      toast.error("Invalid email format");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        companyName,
        companyEmail,
        groupId: selectedGroup?.value || null,
        consigneeIds: selectedConsignees.map((c) => c.value),

        // ✅ IMPORTANT FIX
        commodities: commodityEntries.map((entry) => ({
          _id: entry._id || undefined,
          commodityId: entry.commodityId,
          brokerage: Number(entry.brokerage || 0),
          parameters: (entry.parameters || []).map((p) => ({
            parameterId: p.parameterId,
            value: p.value,
          })),
        })),
      };

      const response = await axios.put(`/companies/${company._id}`, payload);

      const updated = response.data?.data || response.data;

      onUpdate(updated);

      toast.success("Company updated successfully.");

      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update company."
      );
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
          >
            ✖
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">
            Edit Company Details
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataInput
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />

              <DataInput
                placeholder="Company Email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />

              <DataDropdown
                options={groupOptions}
                selectedOptions={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="Select Group"
              />

              <DataDropdown
                options={consigneeOptions}
                selectedOptions={selectedConsignees}
                isMulti
                onChange={(opts) => setSelectedConsignees(opts || [])}
                placeholder="Select Consignees"
              />

              <div className="col-span-2">
                <div className="flex gap-2">
                  <DataDropdown
                    options={commodityOptions}
                    selectedOptions={selectedCommodityToAdd}
                    onChange={setSelectedCommodityToAdd}
                    placeholder="Select Commodity"
                  />

                  <button
                    type="button"
                    onClick={handleAddCommodity}
                    className="bg-emerald-700 text-white px-4 py-2 rounded"
                  >
                    Add
                  </button>
                </div>

                {commodityEntries.map((entry, commodityIndex) => (
                  <div
                    key={commodityIndex}
                    className="border p-4 mt-3 rounded relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveCommodity(commodityIndex)
                      }
                      className="absolute right-2 top-2 text-red-500"
                    >
                      ✖
                    </button>

                    <p className="font-semibold">
                      {getCommodityLabel(entry.commodityId)}
                    </p>

                    <DataInput
                      placeholder="Brokerage"
                      value={entry.brokerage}
                      onChange={(e) =>
                        handleBrokerageChange(
                          commodityIndex,
                          e.target.value
                        )
                      }
                    />

                    {(entry.parameters || []).map((param, paramIndex) => (
                      <div key={paramIndex} className="flex gap-2 mt-2">
                        <p className="flex-1">{param.label}</p>

                        <DataInput
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) =>
                            handleParameterValueChange(
                              commodityIndex,
                              paramIndex,
                              e.target.value
                            )
                          }
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
                className="bg-green-500 text-white px-6 py-2 rounded"
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
