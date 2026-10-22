import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBuilding } from "react-icons/fa";
import addCompanyLable from "../../../language/en/addCompany";
import statesData from "../../../data/state-city.json";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";

const AddCompany = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [selectedConsignee, setSelectedConsignee] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCommodities, setSelectedCommodities] = useState([]);

  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);

  const [location, setLocation] = useState("");
  const [state, setState] = useState(null);
  const [district, setDistrict] = useState(null);
  const [pinCode, setPinCode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consignees, groupsRes, commoditiesRes] = await Promise.all([
          fetchAllPages("/consignees"),
          api.get("/groups"),
          api.get("/commodities"),
        ]);

        const groups = groupsRes.data?.data || groupsRes.data || [];
        const commodities =
          commoditiesRes.data?.data || commoditiesRes.data || [];

        setConsigneeOptions(
          consignees
            .map((item) => ({
              value: item._id,
              label: item.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setGroupOptions(
          groups
            .map((item) => ({
              value: item._id,
              label: item.groupName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setCommodityOptions(
          commodities.map((item) => ({
            value: item._id,
            label: item.name,
            parameters: item.parameters || [],
          })),
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load dropdown data",
        );
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const formattedStates = statesData.map((item) => ({
      value: item.state,
      label: item.state,
      districts: item.district.map((d) => ({
        value: d,
        label: d,
      })),
    }));

    setStateOptions(formattedStates);
  }, []);

  const handleAddCommodity = useCallback(() => {
    setSelectedCommodities((prev) => [
      ...prev,
      {
        commodity: null,
        parameters: [],
        brokerage: "",
      },
    ]);
  }, []);

  const handleCommodityChange = useCallback(
    (index, selectedCommodity) => {
      const commodity = commodityOptions.find(
        (item) => item.value === selectedCommodity.value,
      );

      setSelectedCommodities((prev) => {
        const updated = [...prev];

        updated[index] = {
          commodity: selectedCommodity,
          brokerage: "",
          parameters: (commodity?.parameters || []).map((param) => ({
            ...param,
            values: [
              {
                baseValue: "",
                maxValue: "",
                claimRatioLeft: "1",
                claimRatioRight: "",
              },
            ],
          })),
        };

        return updated;
      });
    },
    [commodityOptions],
  );

  const availableCommodities = useMemo(() => {
    return commodityOptions.filter(
      (commodity) =>
        !selectedCommodities.some(
          (item) => item.commodity && item.commodity.value === commodity.value,
        ),
    );
  }, [commodityOptions, selectedCommodities]);

  const handleParameterChange = useCallback(
    (commodityIndex, paramIndex, value) => {
      setSelectedCommodities((prev) =>
        prev.map((commodity, cIndex) => {
          if (cIndex === commodityIndex) {
            const updatedParams = commodity.parameters.map((param, pIndex) =>
              pIndex === paramIndex ? { ...param, value } : param,
            );

            return { ...commodity, parameters: updatedParams };
          }
          return commodity;
        }),
      );
    },
    [],
  );

  const handleStateChange = (selected) => {
    setState(selected);
    setDistrict(null);

    const found = stateOptions.find((s) => s.value === selected.value);
    setDistrictOptions(found?.districts || []);
  };

  const handleGSTChange = useCallback((value) => {
    setGstNumber(value);

    if (value === "0") {
      setPanNumber("");
    } else if (value.length >= 12) {
      const pan = value.substring(2, 12).toUpperCase();
      setPanNumber(pan);
    } else {
      setPanNumber("");
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!companyName || !companyEmail) {
      toast.error("Company name and email required");
      return;
    }

    if (!regexPatterns.email.test(companyEmail)) {
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

    if (selectedCommodities.length === 0) {
      toast.error("At least one commodity required");
      return;
    }

    const payload = {
      companyName,
      companyEmail,

      location,
      state: state?.value,
      district: district?.value,
      pinCode,

      gstNumber,
      panNumber,

      consigneeIds: selectedConsignee.map((c) => c.value),
      groupId: selectedGroup?.value || null,

      commodities: selectedCommodities.map((entry) => ({
        commodityId: entry.commodity?.value,
        brokerage: parseFloat(entry.brokerage) || 0,
        parameters: entry.parameters
          .map((param) => ({
            parameterId: param.parameterId || param._id,
            values: param.values,
          }))
          .filter((p) => p.parameterId),
      })),
    };
    try {
      const res = await api.post("/companies", payload);
      clearApiCache();
      if (res.status === 201) {
        toast.success("Company added successfully");

        setCompanyName("");
        setCompanyEmail("");
        setSelectedConsignee([]);
        setSelectedGroup(null);
        setSelectedCommodities([]);
        setLocation("");
        setState(null);
        setDistrict(null);
        setPinCode("");
        setGstNumber("");
        setPanNumber("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add company");
    }
  }, [
    companyName,
    companyEmail,
    selectedConsignee,
    selectedGroup,
    selectedCommodities,
    location,
    state,
    district,
    pinCode,
    gstNumber,
    panNumber,
    regexPatterns,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={addCompanyLable.company_title}
        subtitle="Add company with consignees, group, and commodities"
        icon={FaBuilding}
        noContentCard
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="lux-card lux-gold-top p-4 sm:p-6 lg:p-8 w-full">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-center mb-8 text-lux-ink">
              {addCompanyLable.company_title}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  {addCompanyLable.company_name}
                </label>
                <DataInput
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  {addCompanyLable.company_email}
                </label>
                <DataInput
                  placeholder="Enter email"
                  value={companyEmail}
                  inputType="email"
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Location</label>
                <DataInput
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">State</label>
                <DataDropdown
                  options={stateOptions}
                  selectedOptions={state}
                  onChange={handleStateChange}
                  placeholder="Select state"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">District</label>
                <DataDropdown
                  options={districtOptions}
                  selectedOptions={district}
                  onChange={setDistrict}
                  placeholder="Select district"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">PIN Code</label>
                <DataInput
                  placeholder="Enter PIN"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">GST Number</label>
                <DataInput
                  placeholder="Enter GST"
                  value={gstNumber}
                  onChange={(e) => handleGSTChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">PAN Number</label>
                <DataInput
                  placeholder={
                    gstNumber === "0" ? "Enter PAN Number" : "Auto-filled PAN"
                  }
                  value={panNumber}
                  onChange={(e) =>
                    gstNumber === "0" && setPanNumber(e.target.value)
                  }
                  disabled={gstNumber !== "0"}
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  {addCompanyLable.consignee_title}
                </label>

                <DataDropdown
                  options={consigneeOptions}
                  selectedOptions={selectedConsignee}
                  onChange={setSelectedConsignee}
                  isMulti
                  placeholder="Select consignee"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  {addCompanyLable.group_title}
                </label>

                <DataDropdown
                  options={groupOptions}
                  selectedOptions={selectedGroup}
                  onChange={setSelectedGroup}
                  placeholder="Select group"
                />
              </div>
            </div>
            {selectedCommodities.map((entry, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5 mt-6"
              >
                <DataDropdown
                  options={availableCommodities.concat(
                    entry.commodity ? [entry.commodity] : [],
                  )}
                  onChange={(val) => handleCommodityChange(index, val)}
                  placeholder="Select commodity"
                />

                <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
                  {entry.parameters.map((param, pIndex) => (
                    <div key={param.parameter} className="space-y-2">
                      <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                        {param.parameter}
                      </label>

                      {param.values.map((val, vIndex) => (
                        <div
                          key={vIndex}
                          className="rounded-2xl border border-[#ece4d2] bg-lux-cream p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1">
                              <DataInput
                                placeholder={`Base Value`}
                                value={val.baseValue}
                                onChange={(e) => {
                                  setSelectedCommodities((prev) => {
                                    const updated = [...prev];
                                    updated[index].parameters[pIndex].values[
                                      vIndex
                                    ].baseValue = e.target.value;
                                    return updated;
                                  });
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <DataInput
                                placeholder={`Max Value`}
                                value={val.maxValue}
                                onChange={(e) => {
                                  setSelectedCommodities((prev) => {
                                    const updated = [...prev];
                                    updated[index].parameters[pIndex].values[
                                      vIndex
                                    ].maxValue = e.target.value;
                                    return updated;
                                  });
                                }}
                              />
                            </div>

                            {param.values.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCommodities((prev) => {
                                    const updated = [...prev];
                                    updated[index].parameters[pIndex].values =
                                      updated[index].parameters[
                                        pIndex
                                      ].values.filter((_, i) => i !== vIndex);
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
                                setSelectedCommodities((prev) => {
                                  const updated = [...prev];
                                  updated[index].parameters[pIndex].values[
                                    vIndex
                                  ].claimRatioLeft = e.target.value;
                                  return updated;
                                });
                              }}
                            />
                            <span className="text-lg font-bold text-lux-ink">:</span>
                            <DataInput
                              placeholder="20"
                              value={val.claimRatioRight}
                              onChange={(e) => {
                                setSelectedCommodities((prev) => {
                                  const updated = [...prev];
                                  updated[index].parameters[pIndex].values[
                                    vIndex
                                  ].claimRatioRight = e.target.value;
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
                          setSelectedCommodities((prev) => {
                            const updated = [...prev];
                            updated[index].parameters[pIndex].values = [
                              ...updated[index].parameters[pIndex].values,
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
                        className="inline-flex items-center gap-1 text-lux-emerald hover:text-lux-deep text-sm font-semibold"
                      >
                        <span className="text-lg">+</span> Add More
                      </button>
                    </div>
                  ))}

                  <div>
                    <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Brokerage per Ton</label>

                    <DataInput
                      placeholder="Enter brokerage"
                      value={entry.brokerage}
                      onChange={(e) => {
                        setSelectedCommodities((prev) => {
                          const updated = [...prev];
                          updated[index].brokerage = e.target.value;
                          return updated;
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddCommodity}
              className="flex items-center gap-2 font-semibold text-lux-emerald hover:text-lux-deep mt-6"
            >
              <FaPlus className="mr-2" />
              {addCompanyLable.add_another_commodity}
            </button>

            <div className="mt-10 flex justify-center">
              <Buttons
                label={loading ? "Submitting..." : "Submit"}
                disabled={loading}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddCompany;
