import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../utils/apiClient/apiClient";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaFileInvoice, FaSearch, FaHistory, FaDownload } from "react-icons/fa";
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
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
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
                    borderColor: "#e2e8f0",
                    height: "45px",
                    fontSize: "14px",
                  }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
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
                    borderColor: "#e2e8f0",
                    height: "45px",
                    fontSize: "14px",
                  }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                OR Sauda Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type Sauda No..."
                  className="flex-1 h-[45px] px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-bold text-slate-900"
                  value={filters.saudaNo}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, saudaNo: e.target.value }))
                  }
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-[45px] px-6 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <FaSearch />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {saudaList.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Select Sauda to View Details
            </h4>
            <div className="flex flex-wrap gap-3">
              {saudaList.map((sauda) => (
                <button
                  key={sauda._id}
                  onClick={() => openSaudaDetail(sauda)}
                  className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-sm hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm flex items-center gap-2"
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
