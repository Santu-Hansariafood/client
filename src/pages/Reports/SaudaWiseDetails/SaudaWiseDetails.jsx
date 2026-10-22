import { useState, useEffect } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaFileInvoice, FaSearch } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import Select from "react-select";
import { toast } from "react-toastify";
import SaudaDetailPopup from "./SaudaDetailPopup";

const SaudaWiseDetails = () => {
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [filters, setFilters] = useState({
    buyerId: "",
    sellerId: "",
    saudaNo: "",
  });
  const [saudaList, setSaudaList] = useState([]);
  const [selectedSauda, setSelectedSauda] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [buyersRes, sellersRes] = await Promise.all([
          api.get("/buyers"),
          api.get("/sellers"),
        ]);
        setBuyers(
          (buyersRes.data || []).map((b) => ({
            value: b._id,
            label: b.buyerName,
          })),
        );
        setSellers(
          (sellersRes.data || []).map((s) => ({
            value: s._id,
            label: s.sellerName,
          })),
        );
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load search options");
      }
    };
    fetchInitialData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.buyerId) params.buyerId = filters.buyerId;
      if (filters.sellerId) params.sellerId = filters.sellerId;
      if (filters.saudaNo) params.saudaNo = filters.saudaNo;

      const response = await api.get("/self-order", {
        params: { ...params, limit: 0 },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setSaudaList(data);
      if (data.length === 0) {
        toast.info("No Saudas found matching criteria");
      }
    } catch (error) {
      console.error("Error searching saudas:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const openSaudaDetail = (sauda) => {
    setSelectedSauda(sauda);
    setShowPopup(true);
  };

  return (
    <AdminPageShell
      title="Sauda Wise Details"
      subtitle="Comprehensive report of Sauda transactions and payment history"
      icon={FaFileInvoice}
    >
      <div className="space-y-6">
        {/* Search Section */}
        <div className="w-full rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5">
          <div className="grid grid-cols-1 items-end gap-4 sm:gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Buyer Company
              </label>
              <Select
                options={buyers}
                isClearable
                placeholder="Select Buyer..."
                onChange={(opt) =>
                  setFilters((p) => ({ ...p, buyerId: opt?.value || "" }))
                }
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    borderColor: "#e6dcc4",
                    height: "45px",
                    fontSize: "14px",
                  }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Seller Company
              </label>
              <Select
                options={sellers}
                isClearable
                placeholder="Select Seller..."
                onChange={(opt) =>
                  setFilters((p) => ({ ...p, sellerId: opt?.value || "" }))
                }
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    borderColor: "#e6dcc4",
                    height: "45px",
                    fontSize: "14px",
                  }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                OR Sauda Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type Sauda No..."
                  className="h-[45px] flex-1 rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 font-bold text-lux-ink outline-none transition-all focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/30"
                  value={filters.saudaNo}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, saudaNo: e.target.value }))
                  }
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="inline-flex h-[45px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-6 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                >
                  <FaSearch />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {saudaList.length > 0 && (
          <div className="w-full rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5">
            <h4 className="lux-eyebrow mb-4">
              Select Sauda to View Details
            </h4>
            <div className="flex flex-wrap gap-3">
              {saudaList.map((sauda) => (
                <button
                  key={sauda._id}
                  onClick={() => openSaudaDetail(sauda)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 py-2.5 text-sm font-bold text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  <FaFileInvoice className="opacity-50" />
                  {sauda.saudaNo}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <Loading />}
      </div>

      {showPopup && (
        <SaudaDetailPopup
          sauda={selectedSauda}
          onClose={() => setShowPopup(false)}
        />
      )}
    </AdminPageShell>
  );
};

export default SaudaWiseDetails;
