import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DataInput from "../../../common/DataInput/DataInput";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaArrowLeft, FaSave, FaList } from "react-icons/fa";

const AddVendorCode = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    group: null,
    buyer: null,
    seller: null,
    vendorCode: "",
  });

  const [groups, setGroups] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setGroups(
        data.map((g) => ({
          value: g._id,
          label: g.groupName,
        }))
      );
    } catch {
      toast.error("Failed to load groups");
    }
  };

  const fetchBuyers = async (groupName) => {
    try {
      const res = await api.get(`/companies?group=${groupName}`);
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setBuyers(
        data.map((c) => ({
          value: c._id,
          label: c.companyName,
        }))
      );
    } catch {
      toast.error("Failed to load buyer companies");
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await api.get("/sellers");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      const formatted = data.map((s) => ({
        value: s._id,
        label: s.sellerName,
      }));
      setSellers(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load seller companies");
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchSellers();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "group" && { buyer: null }),
    }));

    if (field === "group" && value?.label) {
      fetchBuyers(value.label);
    }
  };

  const handleVendorCodeChange = (e) => {
    let val = e.target.value.toUpperCase();
    val = val.replace(/[^A-Z0-9]/g, "");
    setForm((prev) => ({
      ...prev,
      vendorCode: val,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.group || !form.buyer || !form.seller || !form.vendorCode) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/vendor-codes", {
        group: form.group.value,
        buyer: form.buyer.value,
        seller: form.seller.value,
        vendorCode: form.vendorCode,
      });
      toast.success("Vendor code created successfully");
      navigate("/vendor-code/list");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create vendor code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isReady = form.group && form.buyer && form.seller;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Create Vendor Code</h1>
            <p className="text-slate-500 mt-1">Manage unique vendor identifiers for buyer-seller combinations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <FaArrowLeft /> Back
            </button>
            <button
              onClick={() => navigate("/vendor-code/list")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-semibold shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-all"
            >
              <FaList /> View List
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">1</div>
                  <h2 className="font-bold text-slate-700">Buyer Details</h2>
                </div>

                <DataDropdown
                  label="Select Group"
                  options={groups}
                  selectedOptions={form.group}
                  onChange={(val) => handleChange("group", val)}
                  required
                />

                <DataDropdown
                  label="Buyer Company"
                  options={buyers}
                  selectedOptions={form.buyer}
                  onChange={(val) => handleChange("buyer", val)}
                  isDisabled={!form.group}
                  required
                />
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold">2</div>
                  <h2 className="font-bold text-slate-700">Seller Details</h2>
                </div>

                <DataDropdown
                  label="Seller Company"
                  options={sellers}
                  selectedOptions={form.seller}
                  onChange={(val) => handleChange("seller", val)}
                  required
                />
              </div>
            </div>

            {isReady && (
              <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">3</div>
                  <h2 className="font-bold text-slate-700">Vendor Code</h2>
                </div>
                <div className="max-w-md">
                  <DataInput
                    label="Vendor Code"
                    value={form.vendorCode}
                    onChange={handleVendorCodeChange}
                    placeholder="E.G. VEND001"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-2">Only uppercase letters and numbers are allowed.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !isReady || !form.vendorCode}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${
                loading || !isReady || !form.vendorCode
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-95"
              }`}
            >
              <FaSave /> {loading ? "Creating..." : "Create Vendor Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorCode;
