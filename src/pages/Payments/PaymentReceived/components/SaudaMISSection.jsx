import React, { useState, useEffect, useCallback, lazy } from "react";
import {
  FaFilter,
  FaSearch,
  FaFileInvoice,
  FaArrowRight,
  FaCalendarAlt,
  FaBuilding,
  FaUserTie,
  FaBox,
  FaChartBar,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../../utils/apiClient/apiClient";
const DataDropdown = lazy(() => import("../../../../common/DataDropdown/DataDropdown"));
const Buttons = lazy(() => import("../../../../common/Buttons/Buttons"));
const Loading = lazy(() => import("../../../../common/Loading/Loading"));
const SaudaDetailPopup = lazy(() => import("./SaudaDetailPopup"));
const Paginations = lazy(() => import("../../../../common/Paginations/Paginations"));

const SaudaMISSection = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingCompanies, setFetchingCompanies] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);
  const [saudas, setSaudas] = useState([]);
  const [selectedSauda, setSelectedSauda] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    buyerCompany: "",
    supplierCompany: "",
    saudaNo: "",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setFetchingCompanies(true);
        const response = await api.get("/companies", { params: { limit: 0 } });
        setAllCompanies(response.data.data || response.data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setFetchingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const fetchSaudas = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        buyerCompany: filters.buyerCompany,
        supplierCompany: filters.supplierCompany,
        saudaNo: filters.saudaNo,
        page,
        limit,
      };
      const response = await api.get("/self-orders", { params });
      const items = response.data.data || response.data || [];
      setSaudas(items);
      setTotal(response.data.total || items.length);
    } catch (error) {
      toast.error("Error fetching sauda details");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchSaudas();
  }, [fetchSaudas]);

  const handleSaudaClick = (saudaNo) => {
    setSelectedSauda(saudaNo);
    setShowPopup(true);
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="lux-card lux-gold-top overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#ece4d2] bg-lux-ivory flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-lux-emerald to-lux-deep rounded-xl flex items-center justify-center text-lux-gold-soft">
            <FaFilter size={14} />
          </div>
          <div>
            <h4 className="font-serif font-semibold text-lux-ink">Sauda-wise Search</h4>
            <p className="lux-eyebrow">
              Search by Buyer, Seller or Sauda Number
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
              Buyer Company
            </label>
            <DataDropdown
              options={allCompanies.map((c) => ({
                value: c.companyName,
                label: c.companyName,
              }))}
              selectedOptions={
                filters.buyerCompany
                  ? { value: filters.buyerCompany, label: filters.buyerCompany }
                  : null
              }
              onChange={(opt) =>
                handleFilterChange("buyerCompany", opt?.value || "")
              }
              placeholder="Search Buyer..."
              isMulti={false}
              className="rounded-xl border-[#e4dbc6]"
            />
          </div>

          <div className="space-y-2">
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
              Seller Company
            </label>
            <input
              type="text"
              value={filters.supplierCompany}
              onChange={(e) =>
                handleFilterChange("supplierCompany", e.target.value)
              }
              placeholder="Enter Seller Company..."
              className="w-full h-11 px-4 rounded-xl border border-[#e4dbc6] bg-lux-cream focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-gold outline-none transition text-sm font-bold text-lux-ink"
            />
          </div>

          <div className="space-y-2">
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
              Sauda Number
            </label>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lux-muted" />
              <input
                type="text"
                value={filters.saudaNo}
                onChange={(e) => handleFilterChange("saudaNo", e.target.value)}
                placeholder="Enter Sauda No..."
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#e4dbc6] bg-lux-cream focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-gold outline-none transition text-sm font-bold text-lux-ink"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lux-card lux-gold-top overflow-hidden min-h-[400px]">
        <div className="p-4 sm:p-6 border-b border-[#ece4d2] bg-lux-ivory flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-serif font-semibold text-lux-ink">Available Saudas</h4>
            <p className="lux-eyebrow">
              Review sauda status and open detailed reports
            </p>
          </div>
          <div className="px-3 py-1 bg-gradient-to-r from-lux-emerald to-lux-deep text-lux-gold-soft rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
            {saudas.length} Records Found
          </div>
        </div>

        <div className="p-2">
          {loading ? (
            <Loading />
          ) : saudas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-gold-soft font-serif border-b border-[#ece4d2]">
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest">
                      Sauda No.
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest">
                      Buyer
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest">
                      Seller
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest">
                      Commodity
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest text-right">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-lux-gold-soft uppercase tracking-widest text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece4d2]">
                  {saudas.map((s, idx) => (
                    <tr
                      key={idx}
                      className="odd:bg-lux-cream even:bg-[#f2eee2]/50 hover:bg-lux-ivory transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <span className="font-serif font-semibold text-lux-ink tracking-tight text-lg">
                          {s.saudaNo}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-lux-muted">
                        {s.poDate
                          ? new Date(s.poDate).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-lux-ink uppercase">
                            {s.buyerCompany}
                          </span>
                          <span className="text-[10px] text-lux-muted font-bold uppercase truncate max-w-[150px]">
                            {s.buyer}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-lux-ink uppercase">
                            {s.supplierCompany}
                          </span>
                          <span className="text-[10px] text-lux-muted font-bold uppercase">
                            {s.supplier?.sellerName || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded bg-lux-ivory text-[10px] font-black text-lux-muted uppercase">
                          {s.commodity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-serif text-xs font-semibold text-lux-ink">
                          {s.quantity?.toLocaleString()} {s.unit || "Ton"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleSaudaClick(s.saudaNo)}
                          className="inline-flex items-center gap-2 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-lux-deep hover:to-lux-night transition-all shadow-md active:scale-95"
                        >
                          View Details <FaArrowRight size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-lux-ivory rounded-full flex items-center justify-center text-lux-gold mb-6 border border-[#ece4d2]">
                <FaFileInvoice size={32} />
              </div>
              <h4 className="font-serif text-lg font-semibold text-lux-ink">
                No Saudas Found
              </h4>
              <p className="text-sm text-lux-muted font-medium max-w-xs mx-auto mt-2">
                Try adjusting your search filters to find specific records.
              </p>
            </div>
          )}
        </div>

        {total > limit && (
          <div className="p-4 sm:p-6 border-t border-[#ece4d2] bg-lux-ivory">
            <Paginations
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {showPopup && selectedSauda && (
        <SaudaDetailPopup
          saudaNo={selectedSauda}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default SaudaMISSection;
