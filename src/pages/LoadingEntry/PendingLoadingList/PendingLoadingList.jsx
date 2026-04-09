import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
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
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/self-order/pending/list", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
          startDate,
          endDate,
        },
      });
      setData(response.data.data || []);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching pending loading entries:", error);
      toast.error("Failed to fetch pending entries");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleDownloadExcel = async () => {
    try {
      const toastId = toast.loading("Preparing Excel...");
      // Fetch all pending entries for export (no limit)
      const response = await axios.get("/self-order/pending/list", {
        params: {
          limit: 1000,
          search: searchInput,
          startDate,
          endDate,
        },
      });
      
      const exportData = response.data.data || [];
      
      const excelRows = exportData.map((item, index) => {
        const quantity = item.quantity || 0;
        let pendingQuantity = item.pendingQuantity;
        // Fix: Treat missing or 0 pendingQuantity as full quantity if status is active
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
        };
      });

      if (excelRows.length === 0) {
        toast.dismiss(toastId);
        toast.info("No data available to download.");
        return;
      }

      generateExcel(excelRows, "PendingLoadingEntries.xlsx");
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
    "Status"
  ];

  const rows = data.map((item, index) => {
    const quantity = item.quantity || 0;
    let pendingQuantity = item.pendingQuantity;
    // Fix: Treat missing or 0 pendingQuantity as full quantity if status is active
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
        title="Pending Loading List"
        subtitle="Manage pending loading entries by seller and date"
        icon={FaTruckLoading}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white shadow-lg p-4 sm:p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Search Seller/Buyer/Sauda</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400/50 outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400/50 outline-none transition"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition shadow-sm flex items-center gap-2"
                    title="Download Excel"
                  >
                    <FaDownload />
                  </button>
                </div>
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
