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

      if (userRole === "Seller" && user?.sellerName) {
        params.sellerName = user.sellerName;
      } else {
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
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-slide-up sm:space-y-8">
        <div className="lux-card lux-gold-top relative w-full overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40 sm:h-16 sm:w-16">
                <FaMoneyCheck size={28} />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-lux-ink sm:text-3xl">
                  Payment Release List
                </h1>
                <p className="mt-1 text-sm font-medium text-lux-muted">
                  Manage and track all payment releases
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/payments/payment-release/add")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
            >
              <FaPlus /> Add Payment Release
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            <div className="relative group/input">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-lux-muted transition-colors group-focus-within/input:text-lux-emerald" />
              <input
                type="text"
                placeholder="Search by bill no, lorry no, buyer, seller..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl border border-[#ece4d2] bg-lux-ivory py-3.5 pl-12 pr-4 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/20 sm:py-4"
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
                  <FaFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-lux-muted" />
                  <select
                    value={sellerCompanyFilter}
                    onChange={(e) => setSellerCompanyFilter(e.target.value)}
                    className="w-full rounded-2xl border border-[#ece4d2] bg-lux-ivory py-3.5 pl-12 pr-4 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/20 sm:py-4"
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
                  <FaFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-lux-muted" />
                  <select
                    value={sellerNameFilter}
                    onChange={(e) => setSellerNameFilter(e.target.value)}
                    className="w-full rounded-2xl border border-[#ece4d2] bg-lux-ivory py-3.5 pl-12 pr-4 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/20 sm:py-4"
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

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            >
              <FaFileExcel className="text-lux-emerald" /> Download Excel
            </button>
          </div>
        </div>

        <div className="lux-card lux-gold-top w-full overflow-hidden p-4 sm:p-6">
          <Suspense fallback={<Loading />}>
            {loading ? (
              <Loading />
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
