import { useEffect, useState } from "react";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DataInput from "../../../common/DataInput/DataInput";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";

const AddVendorCode = () => {
  const [form, setForm] = useState({
    group: null,
    buyer: null,
    seller: null,
    vendorCode: "",
  });

  const [groups, setGroups] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);

  const fetchGroups = async () => {
    try {
      const res = await api.get("group");
      setGroups(
        res.data.map((g) => ({
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
      const res = await api.get(`company?group=${groupName}`);
      setBuyers(
        res.data.map((c) => ({
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
    const res = await api.get("seller");

    const data = Array.isArray(res.data) ? res.data : res.data.data;

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

  const isReady = form.group && form.buyer && form.seller;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4 md:p-6">
      
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Create Vendor Code
      </h1>

      <div className="bg-white p-5 rounded-2xl shadow-md">
        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <h2 className="font-semibold text-gray-700 mb-3">
              Buyer Details
            </h2>

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

          <div>
            <h2 className="font-semibold text-gray-700 mb-3">
              Seller Details
            </h2>

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
          <div className="mt-6 border-t pt-6">
            <DataInput
              label="Vendor Code"
              value={form.vendorCode}
              onChange={handleVendorCodeChange}
              placeholder="AUTO CAPITAL (A-Z, 0-9)"
              required
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddVendorCode;