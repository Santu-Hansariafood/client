import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBuilding } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
import generatePDF from "../../../common/GeneratePdf/GeneratePdf";

const ListSellerCompany = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [searchLoading, setSearchLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCompanies = async () => {
      try {
        if (!debouncedSearch && currentPage === 1) {
          setLoading(true);
        }

        setSearchLoading(true);

        const response = await api.get("/seller-company", {
          signal: controller.signal,
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearch || undefined,
            stats: "true",
          },
        });

        setCompanies(response.data?.data || []);
        setTotalItems(response.data?.total ?? response.data?.data?.length ?? 0);
        setLoading(false);
        setSearchLoading(false);
      } catch (err) {
        if (err.name === "CanceledError") return;

        setError(err.response?.data?.message || "Failed to fetch companies");
        console.error(err);
        setLoading(false);
        setSearchLoading(false);
      }
    };

    fetchCompanies();

    return () => {
      controller.abort();
    };
  }, [currentPage, debouncedSearch]);

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const toUpperCase = (str) => {
    if (!str) return "";
    return str.toUpperCase();
  };

  const formatBankDetails = (bankDetails) => {
    if (!bankDetails) return [];
    return bankDetails.map((bank) => ({
      accountHolderName: toUpperCase(bank.accountHolderName),
      accountNumber: toUpperCase(bank.accountNumber),
      ifscCode: toUpperCase(bank.ifscCode),
      branchName: toUpperCase(bank.branchName),
      bankName: toUpperCase(bank.bankName),
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this seller company?")
    ) {
      try {
        await api.delete(`/seller-company/${id}`);
        clearApiCache();
        setCompanies((prev) => prev.filter((company) => company._id !== id));
        setTotalItems((prev) => prev - 1);
        toast.success("Seller company deleted successfully!");
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete seller company.");
      }
    }
  };

  const headers = [
    "Sl No",
    "Company Name",
    "GST No",
    "PAN No",
    "Aadhaar No",
    "Address",
    "State",
    "District",
    "Total Quantity (T)",
    "Brokerage Amount",
    "Bank Details",
    "Actions",
  ];

  const rows = companies.map((company, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    capitalizeWords(company.companyName),
    toUpperCase(company.gstNo),
    toUpperCase(company.panNo),
    company.aadhaarNo,
    capitalizeWords(company.address),
    capitalizeWords(company.state),
    capitalizeWords(company.district),
    <span key={`qty-${company._id}`} className="font-bold text-lux-ink">
      {(company.totalUnloadingWeight || 0).toFixed(2)} T
    </span>,
    <span
      key={`brokerage-${company._id}`}
      className="font-bold text-lux-emerald"
    >
      ₹
      {(company.totalBrokerage || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}
    </span>,
    formatBankDetails(company.bankDetails)?.map((bank, index) => (
      <div key={index} className="mb-2 space-y-0.5 text-xs text-lux-muted">
        <strong>Bank {index + 1}:</strong>
        <div>
          <span className="font-semibold">Holder:</span>{" "}
          {bank.accountHolderName}
        </div>
        <div>
          <span className="font-semibold">Acc No:</span> {bank.accountNumber}
        </div>
        <div>
          <span className="font-semibold">IFSC:</span> {bank.ifscCode}
        </div>
        <div>
          <span className="font-semibold">Branch:</span> {bank.branchName}
        </div>
      </div>
    )),
    <Actions
      key={company._id}
      onView={() => setSelectedCompany(company)}
      onEdit={() => navigate(`/seller-company/edit/${company._id}`)}
      onDelete={() => handleDelete(company._id)}
    />,
  ]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Seller Companies"
        subtitle="Browse seller companies, KYC, and bank details"
        icon={FaBuilding}
        noContentCard
      >
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8">
            <div className="flex w-full max-w-md items-center rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 py-2.5 shadow-sm transition focus-within:border-lux-gold focus-within:ring-2 focus-within:ring-lux-gold/40">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, GST, PAN or account number..."
                className="w-full min-w-0 bg-transparent px-3 py-2 text-lux-ink placeholder:text-lux-muted focus:outline-none"
              />
            </div>
          </div>

          <div className="lux-card w-full p-3 sm:p-4 lg:p-6">
            <Tables headers={headers} rows={rows} />
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>

          {selectedCompany && (
            <PopupBox
              isOpen={true}
              onClose={() => setSelectedCompany(null)}
              title={capitalizeWords(selectedCompany.companyName)}
            >
              <div className="space-y-3 text-lux-muted">
                <p>
                  <strong>GST No:</strong> {toUpperCase(selectedCompany.gstNo)}
                </p>
                <p>
                  <strong>PAN No:</strong> {toUpperCase(selectedCompany.panNo)}
                </p>
                <p>
                  <strong>Aadhaar No:</strong> {selectedCompany.aadhaarNo}
                </p>
                <p>
                  <strong>Address:</strong>{" "}
                  {capitalizeWords(selectedCompany.address)}
                </p>
                <p>
                  <strong>State:</strong>{" "}
                  {capitalizeWords(selectedCompany.state)}
                </p>
                <p>
                  <strong>District:</strong>{" "}
                  {capitalizeWords(selectedCompany.district)}
                </p>
                {selectedCompany.msmeNo && (
                  <p>
                    <strong>MSME No:</strong> {selectedCompany.msmeNo}
                  </p>
                )}
                <p>
                  <strong>Total Quantity:</strong>{" "}
                  <span className="font-bold text-lux-ink">
                    {(selectedCompany.totalUnloadingWeight || 0).toFixed(2)}{" "}
                    Tons
                  </span>
                </p>
                <p>
                  <strong>Total Brokerage:</strong>{" "}
                  <span className="font-bold text-lux-emerald">
                    ₹
                    {(selectedCompany.totalBrokerage || 0).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </p>
                <div className="mt-4">
                  <strong>Bank Details:</strong>
                </div>
                {formatBankDetails(selectedCompany.bankDetails)?.map(
                  (bank, index) => (
                    <div key={index} className="mb-4 border-b border-[#ece4d2] pb-2 text-sm">
                      <p>
                        <strong>Bank {index + 1}:</strong>
                      </p>
                      <p>
                        <strong>Account Holder Name:</strong>{" "}
                        {bank.accountHolderName}
                      </p>
                      <p>
                        <strong>Account Number:</strong> {bank.accountNumber}
                      </p>
                      <p>
                        <strong>IFSC Code:</strong> {bank.ifscCode}
                      </p>
                      <p>
                        <strong>Branch Name:</strong> {bank.branchName}
                      </p>
                      <p>
                        <strong>Bank Name:</strong> {bank.bankName}
                      </p>
                    </div>
                  ),
                )}
                <button
                  onClick={() => generatePDF(selectedCompany)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
                >
                  Download KYC Documents (PDF)
                </button>
              </div>
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ListSellerCompany;
