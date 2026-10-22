import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import statesData from "../../../data/state-city.json";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);

const EditCompanyPopup = ({ company, isOpen, onClose, onUpdate }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState(null);
  const [district, setDistrict] = useState(null);
  const [pinCode, setPinCode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedConsignees, setSelectedConsignees] = useState([]);
  const [commodityEntries, setCommodityEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [selectedCommodityToAdd, setSelectedCommodityToAdd] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consignees, commodityRes, groupRes] = await Promise.all([
          fetchAllPages("/consignees"),
          api.get("/commodities"),
          api.get("/groups"),
        ]);

        const commoditiesData =
          commodityRes.data?.data || commodityRes.data || [];
        const groups = groupRes.data?.data || groupRes.data || [];

        setConsigneeOptions(
          consignees
            .map((c) => ({ value: String(c._id), label: c.name }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setGroupOptions(
          groups
            .map((g) => ({ value: String(g._id), label: g.groupName }))
            .sort((a, b) => a.label.localeCompare(b.label)),
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

        // Pre-fill state options from JSON to use for mapping
        const formattedStates = statesData.map((item) => ({
          value: item.state,
          label: item.state,
          districts: item.district.map((d) => ({
            value: d,
            label: d,
          })),
        }));
        setStateOptions(formattedStates);

        if (company) {
          setCompanyName(company.companyName || "");
          setCompanyEmail(company.companyEmail || "");
          setLocation(company.location || "");
          setPinCode(company.pinCode || "");
          setGstNumber(company.gstNumber || "");
          setPanNumber(company.panNumber || "");

          if (company.state) {
            const stateObj = formattedStates.find(
              (s) => s.value === company.state,
            );
            if (stateObj) {
              setState({ value: stateObj.value, label: stateObj.label });
              setDistrictOptions(stateObj.districts || []);

              if (company.district) {
                const distObj = stateObj.districts.find(
                  (d) => d.value === company.district,
                );
                if (distObj) {
                  setDistrict({ value: distObj.value, label: distObj.label });
                }
              }
            }
          }

          if (company.groupId) {
            const grp = groups.find(
              (g) => String(g._id) === String(company.groupId),
            );
            setSelectedGroup(
              grp ? { value: String(grp._id), label: grp.groupName } : null,
            );
          }

          if (Array.isArray(company.consigneeIds)) {
            const mapped = company.consigneeIds
              .map((id) => {
                const c = consignees.find((x) => String(x._id) === String(id));
                return c ? { value: String(c._id), label: c.name } : null;
              })
              .filter(Boolean);

            setSelectedConsignees(mapped);
          }

          setCommodityEntries(
            Array.isArray(company.commodities)
              ? company.commodities.map((entry) => {
                  const commodityDef = mappedCommodityOptions.find(
                    (c) => String(c.value) === String(entry.commodityId),
                  );

                  return {
                    _id: entry._id || null,
                    commodityId: String(entry.commodityId || ""),
                    brokerage: entry.brokerage ?? 0,
                    parameters: Array.isArray(entry.parameters)
                      ? entry.parameters.map((p) => {
                          const paramDef = commodityDef?.parameters?.find(
                            (pd) => String(pd.value) === String(p.parameterId),
                          );
                          return {
                            parameterId: String(p.parameterId),
                            label: paramDef?.label || p.label || "Parameter",
                            values: Array.isArray(p.values)
                              ? p.values
                              : [
                                  {
                                    baseValue: "",
                                    maxValue: "",
                                    claimRatioLeft: "1",
                                    claimRatioRight: "",
                                  },
                                ],
                          };
                        })
                      : [],
                  };
                })
              : [],
          );
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load required data.",
        );
      }
    };

    if (isOpen) fetchData();
  }, [isOpen, company]);

  if (!isOpen) return null;

  const getCommodityParameterOptions = (commodityId) => {
    const commodity = commodityOptions.find(
      (c) => c.value === String(commodityId),
    );
    return commodity?.parameters || [];
  };

  const getCommodityLabel = (commodityId) => {
    const commodity = commodityOptions.find(
      (c) => c.value === String(commodityId),
    );
    return commodity?.label || "";
  };

  const handleStateChange = (selected) => {
    setState(selected);
    setDistrict(null);

    const found = stateOptions.find((s) => s.value === selected.value);
    setDistrictOptions(found?.districts || []);
  };

  const handleGSTChange = (value) => {
    setGstNumber(value);

    if (value === "0") {
      setPanNumber("");
    } else if (value.length >= 12) {
      const pan = value.substring(2, 12).toUpperCase();
      setPanNumber(pan);
    } else {
      setPanNumber("");
    }
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
          values: [
            {
              baseValue: "",
              maxValue: "",
              claimRatioLeft: "1",
              claimRatioRight: "",
            },
          ],
        })),
      },
    ]);

    setSelectedCommodityToAdd(null);
  };

  const handleRemoveCommodity = (index) => {
    setCommodityEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParameterValueChange = (
    commodityIndex,
    parameterIndex,
    value,
  ) => {
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

    if (!gstNumber) {
      toast.error("GST number required");
      return;
    }

    if (gstNumber === "0") {
      if (!panNumber) {
        toast.error("PAN number is required when GST is 0");
        return;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(panNumber)) {
        toast.error("Invalid PAN number format");
        return;
      }
    } else {
      if (!regexPatterns.gstNo?.test(gstNumber)) {
        toast.error("Invalid GST number");
        return;
      }
    }

    if (!/^\d{6}$/.test(pinCode)) {
      toast.error("Invalid PIN code");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        companyName,
        companyEmail,
        location,
        state: state?.value,
        district: district?.value,
        pinCode,
        gstNumber,
        panNumber,
        groupId: selectedGroup?.value || null,
        consigneeIds: selectedConsignees.map((c) => c.value),

        commodities: commodityEntries.map((entry) => ({
          _id: entry._id || undefined,
          commodityId: entry.commodityId,
          brokerage: Number(entry.brokerage || 0),
          parameters: (entry.parameters || []).map((p) => ({
            parameterId: p.parameterId,
            values: p.values,
          })),
        })),
      };

      const response = await api.put(`/companies/${company._id}`, payload);
      clearApiCache();
      const updated = response.data?.data || response.data;

      onUpdate(updated);

      toast.success("Company updated successfully.");

      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update company.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[#062e25]/70 backdrop-blur-sm animate-modal-backdrop p-0 sm:p-4">
        <div className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream p-4 sm:p-8 shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
          <button
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-2xl text-lux-muted transition hover:bg-[#f2eee2] hover:text-lux-ink active:scale-90"
            onClick={onClose}
          >
            ✖
          </button>

          <h2 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink text-center mb-4 sm:text-lg md:text-xl">
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

              <DataInput
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <DataDropdown
                options={stateOptions}
                selectedOptions={state}
                onChange={handleStateChange}
                placeholder="Select state"
              />

              <DataDropdown
                options={districtOptions}
                selectedOptions={district}
                onChange={setDistrict}
                placeholder="Select district"
              />

              <DataInput
                placeholder="PIN Code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />

              <DataInput
                placeholder="GST Number"
                value={gstNumber}
                onChange={(e) => handleGSTChange(e.target.value)}
              />

              <DataInput
                placeholder="PAN Number"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                disabled={gstNumber !== "0"}
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

              <div className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <DataDropdown
                    options={commodityOptions}
                    selectedOptions={selectedCommodityToAdd}
                    onChange={setSelectedCommodityToAdd}
                    placeholder="Select Commodity"
                  />

                  <button
                    type="button"
                    onClick={handleAddCommodity}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                  >
                    Add
                  </button>
                </div>

                {commodityEntries.map((entry, commodityIndex) => (
                  <div
                    key={commodityIndex}
                    className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 mt-3 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveCommodity(commodityIndex)}
                      className="absolute right-3 top-3 text-rose-500 hover:text-rose-600"
                    >
                      ✖
                    </button>

                    <p className="font-serif font-semibold text-lux-ink">
                      {getCommodityLabel(entry.commodityId)}
                    </p>

                    <DataInput
                      placeholder="Brokerage"
                      value={entry.brokerage}
                      onChange={(e) =>
                        handleBrokerageChange(commodityIndex, e.target.value)
                      }
                    />

                    {(entry.parameters || []).map((param, paramIndex) => (
                      <div key={paramIndex} className="mt-2">
                        <p className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">{param.label}</p>

                        {param.values.map((val, vIndex) => (
                          <div
                            key={vIndex}
                            className="rounded-2xl border border-[#ece4d2] bg-lux-cream p-3 mt-2 space-y-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex-1">
                                <DataInput
                                  placeholder="Base Value"
                                  value={val.baseValue}
                                  onChange={(e) => {
                                    setCommodityEntries((prev) => {
                                      const updated = [...prev];
                                      updated[commodityIndex].parameters[
                                        paramIndex
                                      ].values[vIndex].baseValue =
                                        e.target.value;
                                      return updated;
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <DataInput
                                  placeholder="Max Value"
                                  value={val.maxValue}
                                  onChange={(e) => {
                                    setCommodityEntries((prev) => {
                                      const updated = [...prev];
                                      updated[commodityIndex].parameters[
                                        paramIndex
                                      ].values[vIndex].maxValue =
                                        e.target.value;
                                      return updated;
                                    });
                                  }}
                                />
                              </div>

                              {param.values.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCommodityEntries((prev) => {
                                      const updated = [...prev];
                                      updated[commodityIndex].parameters[
                                        paramIndex
                                      ].values = updated[
                                        commodityIndex
                                      ].parameters[paramIndex].values.filter(
                                        (_, i) => i !== vIndex,
                                      );
                                      return updated;
                                    });
                                  }}
                                  className="text-rose-500 hover:text-rose-600 text-sm"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="lux-eyebrow">Claim Ratio</label>
                              <DataInput
                                placeholder="1"
                                value={val.claimRatioLeft}
                                onChange={(e) => {
                                  setCommodityEntries((prev) => {
                                    const updated = [...prev];
                                    updated[commodityIndex].parameters[
                                      paramIndex
                                    ].values[vIndex].claimRatioLeft =
                                      e.target.value;
                                    return updated;
                                  });
                                }}
                              />
                              <span className="text-lg font-bold text-lux-ink">:</span>
                              <DataInput
                                placeholder="20"
                                value={val.claimRatioRight}
                                onChange={(e) => {
                                  setCommodityEntries((prev) => {
                                    const updated = [...prev];
                                    updated[commodityIndex].parameters[
                                      paramIndex
                                    ].values[vIndex].claimRatioRight =
                                      e.target.value;
                                    return updated;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setCommodityEntries((prev) => {
                              const updated = [...prev];
                              updated[commodityIndex].parameters[
                                paramIndex
                              ].values = [
                                ...updated[commodityIndex].parameters[
                                  paramIndex
                                ].values,
                                {
                                  baseValue: "",
                                  maxValue: "",
                                  claimRatioLeft: "1",
                                  claimRatioRight: "",
                                },
                              ];
                              return updated;
                            });
                          }}
                          className="inline-flex items-center gap-1 text-lux-emerald hover:text-lux-deep text-sm font-semibold mt-2"
                        >
                          <span className="text-lg">+</span> Add More
                        </button>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
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
