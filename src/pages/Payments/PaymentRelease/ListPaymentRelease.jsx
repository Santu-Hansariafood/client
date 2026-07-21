import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import { toast } from "react-toastify";
import {
  FaMoneyCheck,
  FaSearch,
  FaDownload,
  FaFileExcel,
  FaPlus,
  FaFilter,
} from "react-icons/fa";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import DateSelector from "../../../common/DateSelector/DateSelector";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB");
};

const ListPaymentRelease = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sellerCompanyFilter, setSellerCompanyFilter] = useState("");
  const [sellerNameFilter, setSellerNameFilter] = useState("");
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [sellers, setSellers] = useState([]);

  const fetchPaymentReleases = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchInput,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      };

      // Auto-filter for seller users
      if (userRole === "Seller" && user?.sellerName) {
        params.sellerName = user.sellerName;
      } else {
        // Only allow filter for admin/employee
        if (sellerCompanyFilter) params.sellerCompany = sellerCompanyFilter;
        if (sellerNameFilter) params.sellerName = sellerNameFilter;
      }

      const response = await api.get("/payment-releases", { params });
      setData(response.data.data || []);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching payment releases:", error);
      toast.error("Failed to load payment releases");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchInput,
    startDate,
    endDate,
    sellerCompanyFilter,
    sellerNameFilter,
    userRole,
    user,
  ]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [sellerCompaniesData, sellersData] = await Promise.all([
          fetchAllPages("/seller-companies"),
          fetchAllPages("/sellers"),
        ]);
        setSellerCompanies(sellerCompaniesData || []);
        setSellers(sellersData || []);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPaymentReleases();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchPaymentReleases]);

  const headers = [
    "Sl No",
    "Group",
    "Buyer Company",
    "Consignee",
    "Seller Name",
    "Seller Company",
    "Bill No",
    "Lorry No",
    "Payment Amount",
    "Payment Date",
    "Remarks",
  ];

  const rows = data.map((item, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    item.group,
    item.buyerCompany,
    item.consignee,
    item.sellerName,
    item.sellerCompany,
    item.billNumber,
    item.lorryNumber,
    <span key={`amt-${item._id}`} className="font-black text-emerald-700">
      ₹{" "}
      {Number(item.paymentAmount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>,
    formatDate(item.paymentDate),
    item.remarks,
  ]);

  const handleDownloadExcel = async () => {
    try {
      const params = {
        search: searchInput,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      };

      // Auto-filter for seller users
      if (userRole === "Seller" && user?.sellerName) {
        params.sellerName = user.sellerName;
      } else {
        if (sellerCompanyFilter) params.sellerCompany = sellerCompanyFilter;
        if (sellerNameFilter) params.sellerName = sellerNameFilter;
      }

      const response = await api.get("/payment-releases/export/excel", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payment-releases-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Excel Download Error:", error);
      toast.error("Failed to download Excel");
    }
  };

  return (
    <AdminPageShell noContentCard>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 space-y-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <FaMoneyCheck size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  Payment Release List
                </h1>
                <p className="text-sm font-semibold text-slate-400 mt-1">
                  Manage and track all payment releases
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/payments/payment-release/add")}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
            >
              <FaPlus /> Add Payment Release
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="relative group/input">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by bill no, lorry no, buyer, seller..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-3">
              <DateSelector
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholderText="From Date"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <DateSelector
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholderText="To Date"
                className="w-full"
              />
            </div>

            {userRole !== "Seller" && (
              <>
                <div className="relative">
                  <FaFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={sellerCompanyFilter}
                    onChange={(e) => setSellerCompanyFilter(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">All Seller Companies</option>
                    {sellerCompanies.map((company) => (
                      <option key={company._id} value={company.companyName}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <FaFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={sellerNameFilter}
                    onChange={(e) => setSellerNameFilter(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">All Seller Names</option>
                    {sellers.map((seller) => (
                      <option key={seller._id} value={seller.sellerName}>
                        {seller.sellerName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleDownloadExcel}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <FaFileExcel className="text-emerald-600" /> Download Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-slate-100 overflow-hidden">
          <Suspense fallback={<Loading />}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : (
              <>
                <Tables headers={headers} rows={rows} />
                {totalItems > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(page) => setCurrentPage(page)}
                    />
                  </div>
                )}
              </>
            )}
          </Suspense>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default ListPaymentRelease;
