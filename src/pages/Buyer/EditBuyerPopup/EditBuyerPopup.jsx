import PropTypes from "prop-types";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);

import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const isAbortError = (err) =>
  err?.code === "ERR_CANCELED" || err?.name === "CanceledError";

const sortIdsKey = (rows) =>
  (rows || [])
    .map((c) => String(c.value ?? c._id ?? ""))
    .filter(Boolean)
    .sort()
    .join(",");

const normalizeConsigneeRow = (c) => {
  if (!c || typeof c !== "object") return null;
  const value = String(c.value ?? c._id ?? "");
  if (!value) return null;
  const label = c.label || c.name || "Consignee";
  return { value, label };
};

const buildConsigneeListFromBuyer = (buyer) => {
  if (Array.isArray(buyer.consignee) && buyer.consignee.length > 0) {
    return buyer.consignee
      .map(normalizeConsigneeRow)
      .filter(Boolean);
  }
  const ids = buyer.consigneeIds;
  if (Array.isArray(ids) && ids.length > 0) {
    const names = buyer.consigneeNames || [];
    return ids.map((id, idx) => ({
      value: String(id),
      label: names[idx] || "Consignee",
    }));
  }
  return [];
};

const buildFormStateFromBuyer = (buyer) => ({
  ...buyer,
  mobile: Array.isArray(buyer.mobile) ? buyer.mobile : [""],
  email: Array.isArray(buyer.email) ? buyer.email : [""],
  password: buyer.password || "",
  commodity: Array.isArray(buyer.commodity) ? buyer.commodity : [""],
  consignee: buildConsigneeListFromBuyer(buyer),
  selectedCompanies: buyer.companyIds?.length
    ? (buyer.companyIds || []).map((id, idx) => ({
        value: String(id),
        label: (buyer.companyNames || [])[idx] || "Unknown Company",
      }))
    : buyer.companyId
      ? [
          {
            value: String(buyer.companyId),
            label: buyer.companyName || "Unknown Company",
          },
        ]
      : [],
  group: buyer.group || "",
});

const EditBuyerPopup = ({ buyer, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [allConsignees, setAllConsignees] = useState([]);
  const [companiesData, setCompaniesData] = useState([]);
  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [referenceDataLoading, setReferenceDataLoading] = useState(false);
  const [referenceDataError, setReferenceDataError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buyerRef = useRef(buyer);
  const dialogPanelRef = useRef(null);
  buyerRef.current = buyer;

  useEffect(() => {
    if (!isOpen) {
      setFormData(null);
      setReferenceDataError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !buyerRef.current?._id) return;
    setFormData(buildFormStateFromBuyer(buyerRef.current));
  }, [isOpen, buyer?._id]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen || referenceDataLoading || !buyer?._id) return;
    const id = requestAnimationFrame(() => {
      const first =
        dialogPanelRef.current?.querySelector(
          'input[name="name"], input:not([type="hidden"])',
        ) || dialogPanelRef.current?.querySelector("input");
      first?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, referenceDataLoading, buyer?._id]);

  const addableConsigneeOptions = useMemo(() => {
    const chosen = new Set(
      (formData?.consignee || []).map((c) => String(c.value)),
    );
    return (consigneeOptions || []).filter((o) => !chosen.has(String(o.value)));
  }, [consigneeOptions, formData?.consignee]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const { signal } = controller;
    let alive = true;

    const fetchData = async () => {
      setReferenceDataLoading(true);
      setReferenceDataError(null);
      try {
        const [groupsRes, commoditiesRes, consigneesRows, companiesRows] =
          await Promise.all([
            axios.get("/groups", { signal }),
            axios.get("/commodities", { signal }),
            fetchAllPages("/consignees", { limit: 200, signal }).catch(() => []),
            fetchAllPages("/companies", { limit: 200, signal }).catch(() => []),
          ]);

        if (!alive) return;

        const groupsData = groupsRes.data?.data || groupsRes.data || [];
        const commoditiesData =
          commoditiesRes.data?.data || commoditiesRes.data || [];

        setCompaniesData(companiesRows);
        setGroups(
          groupsData.map((group) => ({
            value: String(group._id),
            label: group.groupName,
          })),
        );
        setCommodities(
          commoditiesData.map((c) => ({
            value: String(c._id),
            label: c.name,
          })),
        );
        setAllConsignees(
          consigneesRows.map((c) => ({
            value: String(c._id),
            label: c.name || "Consignee",
          })),
        );
        setCompanies(
          companiesRows.map((company) => ({
            value: String(company._id),
            label: company.companyName,
          })),
        );
      } catch (error) {
        if (!alive || isAbortError(error)) return;
        console.error(error);
        const msg =
          "Could not load dropdown data. Check your connection and try again.";
        setReferenceDataError(msg);
        toast.error("Failed to fetch required data.");
      } finally {
        if (alive) setReferenceDataLoading(false);
      }
    };

    fetchData();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    const labelById = new Map(
      allConsignees.map((o) => [String(o.value), o.label]),
    );

    if (formData?.selectedCompanies?.length > 0 && companiesData.length > 0) {
      const selectedCompanyIds = formData.selectedCompanies.map((c) =>
        String(c.value),
      );
      const selectedCompaniesData = companiesData.filter((c) =>
        selectedCompanyIds.includes(String(c._id)),
      );

      const allConsigneesMap = new Map();
      selectedCompaniesData.forEach((company) => {
        if (Array.isArray(company.consigneeIds)) {
          company.consigneeIds.forEach((id, idx) => {
            const consigneeId = String(id);
            if (!allConsigneesMap.has(consigneeId)) {
              const fromCompany = company.consignee?.[idx];
              const label =
                (typeof fromCompany === "string" && fromCompany) ||
                labelById.get(consigneeId) ||
                "Consignee";
              allConsigneesMap.set(consigneeId, {
                value: consigneeId,
                label,
              });
            }
          });
        }
      });

      setConsigneeOptions(
        Array.from(allConsigneesMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      );
    } else {
      setConsigneeOptions([]);
    }
  }, [formData?.selectedCompanies, companiesData, allConsignees]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleArrayChange = (name, index, updatedValue) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updatedArray = [...(prev[name] || [])];
      updatedArray[index] = updatedValue;
      return { ...prev, [name]: updatedArray };
    });
  };

  const handleGroupChange = (selectedGroup) => {
    setFormData((prevData) => {
      if (!prevData) return prevData;
      const nextGroupId = selectedGroup?.value ?? "";
      const prevGroupId = String(prevData.groupId ?? "");
      const same = String(nextGroupId) === prevGroupId;
      return {
        ...prevData,
        group: selectedGroup?.label ?? "",
        groupId: nextGroupId,
        consignee: same ? prevData.consignee : [],
      };
    });
  };

  const handleCompanyChange = (selectedCompanies) => {
    const next = selectedCompanies || [];
    setFormData((prevData) => {
      if (!prevData) return prevData;
      const prevKey = sortIdsKey(prevData.selectedCompanies);
      const nextKey = sortIdsKey(next);
      return {
        ...prevData,
        selectedCompanies: next,
        consignee: prevKey === nextKey ? prevData.consignee : [],
      };
    });
  };

  const addField = (name) => {
    setFormData((prev) =>
      prev ? { ...prev, [name]: [...(prev[name] || []), ""] } : prev,
    );
  };

  const removeField = (name, index) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: (prev[name] || []).filter((_, i) => i !== index),
          }
        : prev,
    );
  };

  const addConsignee = (consignee) => {
    if (!consignee?.value) return;
    setFormData((prev) => {
      if (!prev) return prev;
      const id = String(consignee.value);
      if ((prev.consignee || []).some((c) => String(c.value) === id)) {
        toast.warning("Consignee already added");
        return prev;
      }
      return {
        ...prev,
        consignee: [
          ...(prev.consignee || []),
          { value: id, label: consignee.label || "Consignee" },
        ],
      };
    });
  };

  const removeConsignee = (index) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            consignee: (prev.consignee || []).filter((_, i) => i !== index),
          }
        : prev,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData?._id || isSubmitting || referenceDataLoading) return;

    const nameTrimmed = (formData.name || "").trim();
    if (!nameTrimmed) {
      toast.error("Buyer name is required.");
      return;
    }

    if (
      !(formData.mobile || []).some(
        (num) => num.trim() && regexPatterns.mobile.test(num.trim()),
      )
    ) {
      toast.error("Enter at least one valid mobile number.");
      return;
    }

    if (
      formData.mobile.some(
        (num) => num.trim() && !regexPatterns.mobile.test(num.trim()),
      )
    ) {
      toast.error("Invalid mobile number format.");
      return;
    }

    if (
      formData.email.some(
        (mail) => mail.trim() && !regexPatterns.email.test(mail.trim()),
      )
    ) {
      toast.error("Invalid email format.");
      return;
    }

    setIsSubmitting(true);
    try {
      const commodityIds = (formData.commodity || []).map((comm) => {
        if (typeof comm === "string") {
          const match = commodities.find((c) => c.label === comm);
          return match ? match.value : comm;
        }
        if (comm && typeof comm === "object") {
          return comm.value || comm.label || "";
        }
        return "";
      });

      const consigneeIds = (formData.consignee || []).map(
        (c) => String(c.value || c._id || ""),
      );

      const payload = {
        name: nameTrimmed,
        mobile: (formData.mobile || []).map((m) => String(m).trim()),
        email: (formData.email || []).map((m) => String(m).trim()),
        companyIds: (formData.selectedCompanies || []).map((c) =>
          String(c.value),
        ),
        groupId: formData.groupId || null,
        commodityIds: commodityIds.filter(Boolean),
        consigneeIds: consigneeIds.filter(Boolean),
        status: formData.status || "Active",
        brokerage: formData.brokerage || {},
      };

      const passwordTrimmed = (formData.password || "").trim();
      if (passwordTrimmed) {
        payload.password = passwordTrimmed;
      }

      const response = await axios.put(`/buyers/${formData._id}`, payload);
      onUpdate(response.data);
    } catch (error) {
      const message =
        error.response?.data?.message || "An error occurred while updating.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
        role="presentation"
        onClick={handleClose}
      >
        <div
          ref={dialogPanelRef}
          className="relative w-full max-w-4xl mx-auto rounded-2xl bg-white/95 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-buyer-title"
          onClick={(e) => e.stopPropagation()}
        >
          {referenceDataLoading && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/85 backdrop-blur-[2px]"
              aria-busy="true"
              aria-live="polite"
            >
              <Loading />
            </div>
          )}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent rounded-t-2xl shrink-0">
            <div>
              <h2
                id="edit-buyer-title"
                className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight"
              >
                Edit Buyer
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Update buyer profile, access and contact details.
              </p>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:border-red-200 shadow-sm transition disabled:opacity-50"
              onClick={handleClose}
              title="Close"
              type="button"
              disabled={isSubmitting}
              aria-label="Close dialog"
            >
              ✖
            </button>
          </div>

          {referenceDataError && (
            <div
              className="mx-6 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="alert"
            >
              {referenceDataError}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <form
              onSubmit={handleSubmit}
              className={`space-y-6 ${isSubmitting ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Buyer Name
                  </label>
                  <DataInput
                    placeholder="Enter buyer name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                    disabled={referenceDataLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Company
                  </label>
                  <DataDropdown
                    options={companies}
                    selectedOptions={formData.selectedCompanies || []}
                    onChange={handleCompanyChange}
                    placeholder="Select companies"
                    isMulti
                    isDisabled={referenceDataLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Password
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Leave blank to keep the current password.
                  </p>
                  <DataInput
                    placeholder="New password (optional)"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    inputType="password"
                    disabled={referenceDataLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Group
                  </label>
                  <DataDropdown
                    options={groups}
                    selectedOptions={groups.find(
                      (group) =>
                        String(group.value) === String(formData.groupId ?? ""),
                    )}
                    onChange={handleGroupChange}
                    placeholder="Select group"
                    isDisabled={referenceDataLoading || isSubmitting}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-700">
                    Contact Details
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Add multiple mobiles and emails if needed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-medium text-slate-600 mb-1">
                      Mobile Numbers
                    </p>
                    {(formData.mobile || []).map((number, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <DataInput
                          placeholder="Enter mobile number"
                          value={number}
                          onChange={(e) =>
                            handleArrayChange("mobile", index, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeField("mobile", index)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white text-xs shadow-sm hover:bg-red-600 transition"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addField("mobile")}
                      className="mt-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      + Add mobile
                    </button>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-slate-600 mb-1">
                      Email Addresses
                    </p>
                    {(formData.email || []).map((email, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <DataInput
                          placeholder="Enter email address"
                          value={email}
                          onChange={(e) =>
                            handleArrayChange("email", index, e.target.value)
                          }
                          inputType="email"
                        />
                        <button
                          type="button"
                          onClick={() => removeField("email", index)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white text-xs shadow-sm hover:bg-red-600 transition"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addField("email")}
                      className="mt-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      + Add email
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold tracking-wide text-slate-600">
                      Commodities
                    </label>
                    <button
                      type="button"
                      onClick={() => addField("commodity")}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      + Add commodity
                    </button>
                  </div>
                  {(formData.commodity || []).map((comm, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <select
                        value={comm}
                        onChange={(e) =>
                          handleArrayChange("commodity", index, e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select commodity</option>
                        {(commodities || []).map((commodity) => (
                          <option key={commodity.value} value={commodity.label}>
                            {commodity.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeField("commodity", index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white text-xs shadow-sm hover:bg-red-600 transition"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-600">
                    Consignee Access
                  </label>
                  <div className="space-y-2">
                    {(formData.consignee || []).map((consignee, index) => (
                      <div
                        key={`${consignee.value}-${index}`}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-100"
                      >
                        <span className="text-sm text-slate-700">
                          {consignee.label ||
                            allConsignees.find(
                              (a) => String(a.value) === String(consignee.value),
                            )?.label ||
                            "Consignee"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeConsignee(index)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-[11px] shadow-sm hover:bg-red-600 transition"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                  <DataDropdown
                    options={addableConsigneeOptions}
                    selectedOptions={null}
                    onChange={(selectedConsignee) => {
                      if (!selectedConsignee) return;
                      addConsignee({
                        label: selectedConsignee.label,
                        value: selectedConsignee.value,
                      });
                    }}
                    placeholder="Add consignee"
                    isDisabled={referenceDataLoading || isSubmitting}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Buyer status</span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    name="status"
                    value={formData.status || "Active"}
                    onChange={handleChange}
                    disabled={referenceDataLoading || isSubmitting}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-60"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <button
                    type="submit"
                    disabled={referenceDataLoading || isSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

EditBuyerPopup.propTypes = {
  buyer: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditBuyerPopup;
