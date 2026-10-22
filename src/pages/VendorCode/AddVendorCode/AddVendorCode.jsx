import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DataInput from "../../../common/DataInput/DataInput";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaArrowLeft, FaSave, FaList, FaBarcode } from "react-icons/fa";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";

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
  const [fetchingBuyers, setFetchingBuyers] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups", { params: { limit: 0 } });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setGroups(
        data.map((g) => ({
          value: g._id,
          label: g.groupName,
        })),
      );
    } catch {
      toast.error("Failed to load groups");
    }
  };

  const fetchBuyers = async (groupId) => {
    setFetchingBuyers(true);
    try {
      const res = await api.get(`/companies`, {
        params: { groupId, limit: 0 },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setBuyers(
        data.map((c) => ({
          value: c._id,
          label: c.companyName,
        })),
      );
    } catch {
      toast.error("Failed to load buyer companies");
    } finally {
      setFetchingBuyers(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await api.get("/sellers", { params: { limit: 0 } });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      const formatted = data.map((s) => ({
        value: s._id,
        label:
          s.companies && s.companies.length > 0 ? s.companies[0] : s.sellerName,
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

    if (field === "group") {
      if (value?.value) {
        fetchBuyers(value.value);
      } else {
        setBuyers([]);
      }
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
      clearApiCache();
      toast.success("Vendor code created successfully");
      navigate("/vendor-code/list");
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to create vendor code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isReady = form.group && form.buyer && form.seller;

  return (
    <AdminPageShell
      title="Create Vendor Code"
      subtitle="Manage unique vendor identifiers for buyer-seller combinations"
      icon={FaBarcode}
      noContentCard
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d9c5] bg-lux-cream px-4 py-2 text-sm font-semibold text-lux-ink shadow-sm transition-all hover:bg-[#f5f0e4]"
          >
            <FaArrowLeft /> Back
          </button>
          <button
            onClick={() => navigate("/vendor-code/list")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ece4d2] bg-lux-ivory px-4 py-2 text-sm font-semibold text-lux-emerald shadow-sm transition-all hover:bg-[#efe9d8]"
          >
            <FaList /> View List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-[#ece4d2] mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                    1
                  </div>
                  <h2 className="font-serif text-lg font-bold uppercase tracking-tight text-lux-ink">
                    Buyer Selection
                  </h2>
                </div>

                <div className="space-y-4">
                  <DataDropdown
                    label="Select Group"
                    options={groups}
                    selectedOptions={form.group}
                    onChange={(val) => handleChange("group", val)}
                    required
                  />

                  <div className="relative">
                    <DataDropdown
                      label="Buyer Company"
                      options={buyers}
                      selectedOptions={form.buyer}
                      onChange={(val) => handleChange("buyer", val)}
                      isDisabled={!form.group || fetchingBuyers}
                      required
                    />
                    {fetchingBuyers && (
                      <div className="absolute right-0 top-0 mt-1 mr-1">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-[#ece4d2] mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                    2
                  </div>
                  <h2 className="font-serif text-lg font-bold uppercase tracking-tight text-lux-ink">
                    Seller Selection
                  </h2>
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
              <div className="mt-10 pt-10 border-t border-[#ece4d2] animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-3 pb-4 border-b border-[#ece4d2] mb-8">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lux-emerald/10 text-sm font-bold text-lux-emerald">
                    3
                  </div>
                  <h2 className="font-serif text-lg font-bold uppercase tracking-tight text-lux-ink">
                    Assign Vendor Code
                  </h2>
                </div>
                <div className="max-w-md rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6">
                  <DataInput
                    label="Vendor Code"
                    value={form.vendorCode}
                    onChange={handleVendorCodeChange}
                    placeholder="E.G. VEND001"
                    required
                  />
                  <div className="flex items-start gap-2 mt-3 text-lux-muted">
                    <span className="text-[10px] bg-lux-emerald/10 text-lux-emerald px-1.5 py-0.5 rounded font-bold mt-0.5">
                      INFO
                    </span>
                    <p className="text-xs">
                      Only uppercase letters (A-Z) and numbers (0-9) are
                      allowed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col pt-2 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={loading || !isReady || !form.vendorCode}
              className={`flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-bold text-white shadow-xl transition-all duration-300 ${
                loading || !isReady || !form.vendorCode
                  ? "bg-lux-muted/40 cursor-not-allowed translate-y-0"
                  : "bg-gradient-to-r from-lux-emerald to-lux-deep hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <Loading />
              ) : (
                <>
                  <FaSave className="text-lg" />
                  Generate Vendor Code
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
};

export default AddVendorCode;
