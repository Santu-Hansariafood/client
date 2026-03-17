import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
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
const generatePDF = lazy(
  () => import("../../../common/GeneratePdf/GeneratePdf"),
);
const EditSellerCompany = lazy(
  () => import("../EditSellerCompany/EditSellerCompany"),
);

const ListSellerCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editCompany, setEditCompany] = useState(null);
  const [searchText, setSearchText] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/seller-company", {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchText,
          },
        });
        setCompanies(response.data.data);
        setSearchResults(response.data.data);
        setTotalItems(response.data.total || response.data.data.length);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch companies");
        console.error(err);
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [currentPage, searchText]);

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
        await axios.delete(`/seller-company/${id}`);
        setCompanies((prev) => prev.filter((company) => company._id !== id));
        setSearchResults((prev) =>
          prev.filter((company) => company._id !== id),
        );
        setTotalItems((prev) => prev - 1);
        toast.success("Seller company deleted successfully!");
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete seller company.");
      }
    }
  };

  const headers = [
    "Sl No.",
    "Company Name",
    "GST No",
    "PAN No",
    "Aadhaar No",
    "Address",
    "State",
    "District",
    "MSME No",
    "Bank Details",
    "Actions",
  ];

  const rows = searchResults.map((company, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    capitalizeWords(company.companyName),
    toUpperCase(company.gstNo),
    toUpperCase(company.panNo),
    company.aadhaarNo,
    capitalizeWords(company.address),
    capitalizeWords(company.state),
    capitalizeWords(company.district),
    company.msmeNo || "-",
    formatBankDetails(company.bankDetails)?.map((bank, index) => (
      <div key={index} className="text-xs space-y-0.5 mb-2">
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
      onEdit={() => setEditCompany(company)}
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <div className="flex items-center w-full max-w-md bg-white border border-emerald-100 rounded-xl px-4 py-2.5 shadow-md shadow-emerald-900/5 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-400/50 focus-within:border-emerald-400">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, GST, PAN or account number..."
                className="w-full min-w-0 px-3 py-2 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
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
              <div className="space-y-3">
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
                <div className="mt-4">
                  <strong>Bank Details:</strong>
                </div>
                {formatBankDetails(selectedCompany.bankDetails)?.map(
                  (bank, index) => (
                    <div key={index} className="mb-4 border-b pb-2 text-sm">
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl mt-4 font-semibold transition"
                >
                  Download KYC Documents (PDF)
                </button>
              </div>
            </PopupBox>
          )}
          {editCompany && (
            <PopupBox
              isOpen={true}
              onClose={() => setEditCompany(null)}
              title={`Edit ${editCompany.companyName}`}
            >
              <EditSellerCompany
                company={editCompany}
                onSave={(updatedCompany) => {
                  setCompanies((prev) =>
                    prev.map((company) =>
                      company._id === updatedCompany._id
                        ? updatedCompany
                        : company,
                    ),
                  );
                  setSearchResults((prev) =>
                    prev.map((company) =>
                      company._id === updatedCompany._id
                        ? updatedCompany
                        : company,
                    ),
                  );
                  setEditCompany(null);
                }}
                onCancel={() => setEditCompany(null)}
              />
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ListSellerCompany;
