import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTruckLoading, FaSearch, FaDownload } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

const PendingLoadingList = () => {
  const { userRole, mobile } = useAuth();
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [buyerCompany, setBuyerCompany] = useState("");
  const [sellerCompany, setSellerCompany] = useState("");
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchBuyerAndSellerCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const [buyersRes, sellersRes] = await Promise.all([
        axios.get("/companies?limit=0"),
        axios.get("/seller-company?limit=0"),
      ]);
      
      const buyerCompanyNames = (buyersRes.data?.data || buyersRes.data || [])
        .map(c => c.companyName)
        .filter(Boolean);
      
      const sellerCompanyNames = (sellersRes.data?.data || sellersRes.data || [])
        .map(c => c.companyName)
        .filter(Boolean);
      
      setBuyerCompanies([...new Set(buyerCompanyNames)].sort());
      setSellerCompanies([...new Set(sellerCompanyNames)].sort());
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/self-order/pending/list", {
        params: {
          page: 1,
          limit: 1000,
        },
      });
      const fetchedData = response.data.data || [];
      setAllData(fetchedData);
      
      const uniqueSellerCompanies = [...new Set(fetchedData.map(item => item.supplierCompany).filter(Boolean))].sort();
      const uniqueBuyerCompanies = [...new Set(fetchedData.map(item => item.buyerCompany).filter(Boolean))].sort();
      
      setSellerCompanies(prev => [...new Set([...prev, ...uniqueSellerCompanies])].sort());
      setBuyerCompanies(prev => [...new Set([...prev, ...uniqueBuyerCompanies])].sort());
    } catch (error) {
      console.error("Error fetching pending loading entries:", error);
      toast.error("Failed to fetch pending entries");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredData = useCallback(() => {
    let result = [...allData];
    
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      result = result.filter(item => 
        (item.supplierCompany && item.supplierCompany.toLowerCase().includes(searchLower)) ||
        (item.buyerCompany && item.buyerCompany.toLowerCase().includes(searchLower)) ||
        (item.saudaNo && item.saudaNo.toLowerCase().includes(searchLower)) ||
        (item.commodity && item.commodity.toLowerCase().includes(searchLower))
      );
    }
    
    if (sellerCompany) {
      result = result.filter(item => item.supplierCompany === sellerCompany);
    }
    
    if (buyerCompany) {
      result = result.filter(item => item.buyerCompany === buyerCompany);
    }
    
    if (startDate) {
      const filterDate = new Date(startDate);
      filterDate.setHours(0, 0, 0, 0);
      result = result.filter(item => {
        const itemDate = new Date(item.poDate || item.createdAt);
        return itemDate >= filterDate;
      });
    }
    
    if (endDate) {
      const filterDate = new Date(endDate);
      filterDate.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const itemDate = new Date(item.poDate || item.createdAt);
        return itemDate <= filterDate;
      });
    }
    
    return result;
  }, [allData, searchInput, sellerCompany, buyerCompany, startDate, endDate]);

  useEffect(() => {
    const filtered = filteredData();
    setTotalItems(filtered.length);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setData(filtered.slice(startIndex, endIndex));
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchBuyerAndSellerCompanies();
    fetchData();
  }, [fetchBuyerAndSellerCompanies, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setBuyerCompany("");
    setSellerCompany("");
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, sellerCompany, buyerCompany, startDate, endDate]);

  const handleDownloadExcel = async () => {
    try {
      const toastId = toast.loading("Preparing Excel...");
      const exportData = filteredData();
      
      const excelRows = exportData.map((item, index) => {
        const quantity = item.quantity || 0;
        let pendingQuantity = item.pendingQuantity;
        if ((pendingQuantity === undefined || pendingQuantity === null || (pendingQuantity === 0 && item.status === "active")) && item.status !== "closed") {
          pendingQuantity = quantity;
        } else {
          pendingQuantity = pendingQuantity || 0;
        }
        const loadedQuantity = quantity - pendingQuantity;

        return {
          "Sl No": index + 1,
          "Date": formatDate(item.poDate || item.createdAt),
          "Sauda No": item.saudaNo || "N/A",
          "Seller Company": item.supplierCompany || "N/A",
          "Seller Name": item.supplier?.sellerName || "N/A",
          "Buyer Company": item.buyerCompany || "N/A",
          "Commodity": item.commodity || "N/A",
          "Total Quantity": quantity,
          "Pending Quantity": pendingQuantity,
          "Loaded Quantity": loadedQuantity.toFixed(2),
          "Rate": item.rate || 0,
          "Payment Terms": item.paymentTerms || "N/A",
        };
      });

      if (excelRows.length === 0) {
        toast.dismiss(toastId);
        toast.info("No data available to download.");
        return;
      }

      await generateExcel(excelRows, "PendingSauda.xlsx");
      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("Failed to generate Excel");
    }
  };

  const headers = [
    "Sl No",
    "Date",
    "Sauda No",
    "Seller Company",
    "Seller Name",
    "Buyer Company",
    "Commodity",
    "Total Qty",
    "Pending Qty",
    "Loaded Qty",
    "Rate",
    "Payment Terms",
    "Status"
  ];

  const rows = data.map((item, index) => {
    const quantity = item.quantity || 0;
    let pendingQuantity = item.pendingQuantity;
    if ((pendingQuantity === undefined || pendingQuantity === null || (pendingQuantity === 0 && item.status === "active")) && item.status !== "closed") {
      pendingQuantity = quantity;
    } else {
      pendingQuantity = pendingQuantity || 0;
    }
    const loadedQuantity = quantity - pendingQuantity;

    return [
      (currentPage - 1) * itemsPerPage + index + 1,
      formatDate(item.poDate || item.createdAt),
      item.saudaNo || "N/A",
      <span key={`seller-co-${item._id}`} className="font-semibold text-slate-700">{item.supplierCompany || "N/A"}</span>,
      item.supplier?.sellerName || "N/A",
      item.buyerCompany || "N/A",
      item.commodity || "N/A",
      quantity,
      <span key={`pending-${item._id}`} className="text-amber-600 font-bold">{pendingQuantity}</span>,
      loadedQuantity.toFixed(2),
      item.rate || 0,
      item.paymentTerms || "N/A",
      <span
        key={`status-${item._id}`}
        className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"
      >
        Active
      </span>,
    ];
  });

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Pending Sauda"
        subtitle="Manage pending saudas by seller and date"
        icon={FaTruckLoading}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FaSearch className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Filter & Search</h3>
                <p className="text-sm text-slate-500">Customize your view with advanced filters</p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="xl:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Search Seller/Buyer/Sauda
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Enter search term..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Seller Company
                  </label>
                  <select
                    value={sellerCompany}
                    onChange={(e) => setSellerCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white cursor-pointer"
                  >
                    <option value="">All Sellers</option>
                    {sellerCompanies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Buyer Company
                  </label>
                  <select
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white cursor-pointer"
                  >
                    <option value="">All Buyers</option>
                    {buyerCompanies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <FaSearch />
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="min-w-[140px] px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all duration-200 border-2 border-slate-200 flex items-center justify-center gap-2"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="min-w-[140px] px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-bold hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Export Excel
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><Loading /></div>
            ) : data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Tables headers={headers} rows={rows} />
                </div>
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-500 font-medium">
                No pending entries found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default PendingLoadingList;
