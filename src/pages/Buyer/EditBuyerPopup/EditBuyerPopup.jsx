import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);

const EditBuyerPopup = ({ buyer, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [allConsignees, setAllConsignees] = useState([]);

  useEffect(() => {
    if (buyer) {
      setFormData({
        ...buyer,
        mobile: Array.isArray(buyer.mobile) ? buyer.mobile : [""],
        email: Array.isArray(buyer.email) ? buyer.email : [""],
        password: buyer.password || "",
        commodity: Array.isArray(buyer.commodity) ? buyer.commodity : [""],
        consignee: Array.isArray(buyer.consignee) ? buyer.consignee : [],
        companyName: buyer.companyName || "",
        group: buyer.group || "",
      });
    }
  }, [buyer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, commoditiesRes, consigneesRes, companiesRes] =
          await Promise.all([
            axios.get("/groups"),
            axios.get("/commodities"),
            axios.get("/consignees"),
            axios.get("/companies"),
          ]);

        const groupsData = groupsRes.data?.data || groupsRes.data || [];
        const commoditiesData =
          commoditiesRes.data?.data || commoditiesRes.data || [];
        const consigneesData =
          consigneesRes.data?.data || consigneesRes.data || [];
        const companiesData =
          companiesRes.data?.data || companiesRes.data || [];

        setGroups(
          groupsData.map((group) => ({
            value: String(group._id),
            label: group.groupName,
          }))
        );
        setCommodities(
          commoditiesData.map((c) => ({
            value: String(c._id),
            label: c.name,
          }))
        );
        setAllConsignees(
          consigneesData.map((c) => ({
            value: String(c._id),
            label: c.name,
          }))
        );
        setCompanies(
          companiesData.map((company) => ({
            value: String(company._id),
            label: company.companyName,
          }))
        );
      } catch (error) {
        toast.error("Failed to fetch required data.", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayChange = (name, index, updatedValue) => {
    const updatedArray = [...formData[name]];
    updatedArray[index] = updatedValue;
    setFormData({ ...formData, [name]: updatedArray });
  };

  const handleGroupChange = (selectedGroup) => {
    setFormData((prevData) => ({
      ...prevData,
      group: selectedGroup.label,
      groupId: selectedGroup.value,
      consignee: [],
    }));
  };

  const handleCompanyChange = (selectedCompany) => {
    setFormData((prevData) => ({
      ...prevData,
      companyName: selectedCompany?.label || "",
      companyId: selectedCompany?.value || "",
    }));
  };

  const addField = (name) => {
    setFormData({
      ...formData,
      [name]: [...formData[name], ""],
    });
  };

  const removeField = (name, index) => {
    setFormData({
      ...formData,
      [name]: formData[name].filter((_, i) => i !== index),
    });
  };

  const handleBrokerageChange = (commodity, value) => {
    setFormData({
      ...formData,
      brokerage: {
        ...formData.brokerage,
        [commodity]: value,
      },
    });
  };

  const addConsignee = (consignee) => {
    if (!formData.consignee.some((c) => c.value === consignee.value)) {
      setFormData({
        ...formData,
        consignee: [...formData.consignee, consignee],
      });
    } else {
      toast.warning("Consignee already added");
    }
  };

  const removeConsignee = (index) => {
    const updatedConsignees = formData.consignee.filter((_, i) => i !== index);
    setFormData({ ...formData, consignee: updatedConsignees });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        (c) => c.value || c._id || ""
      );

      const payload = {
        name: formData.name,
        password: formData.password,
        mobile: formData.mobile,
        email: formData.email,
        companyId: formData.companyId || null,
        groupId: formData.groupId || null,
        commodityIds,
        consigneeIds,
        status: formData.status || "Active",
        brokerage: formData.brokerage || {},
      };
      const response = await axios.put(
        `/buyers/${formData._id}`,
        payload
      );
      onUpdate(response.data);
      toast.success("Buyer updated successfully");
    } catch (error) {
      const message =
        error.response?.data?.message || "An error occurred while updating.";
      toast.error(message);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl mx-4 rounded-2xl bg-white/95 shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent rounded-t-2xl">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                Edit Buyer
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Update buyer profile, access and contact details.
              </p>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:border-red-200 shadow-sm transition"
              onClick={onClose}
              title="Close"
              type="button"
            >
              ✖
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 pb-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Company
                  </label>
                  <DataDropdown
                    options={companies}
                    selectedOptions={
                      formData.companyId
                        ? {
                            value: formData.companyId,
                            label: formData.companyName,
                          }
                        : null
                    }
                    onChange={handleCompanyChange}
                    placeholder="Select company"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Password
                  </label>
                  <DataInput
                    placeholder="Enter password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-600">
                    Group
                  </label>
                  <DataDropdown
                    options={groups}
                    selectedOptions={groups.find(
                      (group) => group.value === formData.groupId
                    )}
                    onChange={handleGroupChange}
                    placeholder="Select group"
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
                      <div
                        key={index}
                        className="flex items-center gap-2 mb-2"
                      >
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
                      <div
                        key={index}
                        className="flex items-center gap-2 mb-2"
                      >
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
                    <div
                      key={index}
                      className="flex items-center gap-2 mb-2"
                    >
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
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-100"
                      >
                        <span className="text-sm text-slate-700">
                          {consignee.label}
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
                    options={allConsignees || []}
                    selectedOptions={null}
                    onChange={(selectedConsignee) => {
                      addConsignee({
                        label: selectedConsignee.label,
                        value: selectedConsignee.value,
                      });
                    }}
                    placeholder="Add consignee"
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
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    Save changes
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
  buyer: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditBuyerPopup;
