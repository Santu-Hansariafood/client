import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBuilding } from "react-icons/fa";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const generatePDF = lazy(() =>
  import("../../../common/GeneratePdf/GeneratePdf")
);
const EditSellerCompany = lazy(() =>
  import("../EditSellerCompany/EditSellerCompany")
);

const ListSellerCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editCompany, setEditCompany] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("/seller-company");
        setCompanies(response.data.data);
        setSearchResults(response.data.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch companies", err);
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const capitalizeWords = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const toUpperCase = (str) => {
    return str.toUpperCase();
  };

  const formatBankDetails = (bankDetails) => {
    return bankDetails.map((bank) => ({
      accountHolderName: toUpperCase(bank.accountHolderName),
      accountNumber: toUpperCase(bank.accountNumber),
      ifscCode: toUpperCase(bank.ifscCode),
      branchName: toUpperCase(bank.branchName),
      // bankName: toUpperCase(bank.bankName),
    }));
  };

  const handleSearch = (filteredItems) => {
    if (filteredItems.length === 0) {
      setSearchResults(companies); // Reset when search is empty
      return;
    }

    const results = companies.filter(
      (company) =>
        filteredItems.includes(company.companyName) ||
        company.bankDetails?.some((bank) =>
          filteredItems.includes(bank.accountNumber)
        )
    );

    setSearchResults(results);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const headers = [
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

  const rows = searchResults
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((company) => [
      capitalizeWords(company.companyName),
      toUpperCase(company.gstNo),
      toUpperCase(company.panNo),
      company.aadhaarNo,
      capitalizeWords(company.address),
      capitalizeWords(company.state),
      capitalizeWords(company.district),
      company.msmeNo || "-",
      formatBankDetails(company.bankDetails)?.map((bank, index) => (
        <div key={index}>
          <strong>Bank {index + 1}:</strong>
          <div>
            <span style={{ fontWeight: "bold" }}>Account Holder Name:</span>{" "}
            {bank.accountHolderName}
          </div>
          <div>
            <span style={{ fontWeight: "bold" }}>Account Number:</span>{" "}
            {bank.accountNumber}
          </div>
          <div>
            <span style={{ fontWeight: "bold" }}>IFSC:</span> {bank.ifscCode}
          </div>
          <div>
            <span style={{ fontWeight: "bold" }}>Branch Name:</span>{" "}
            {bank.branchName}
          </div>
          <div>
            <span style={{ fontWeight: "bold" }}>Bank Name:</span>{" "}
            {bank.bankName}
          </div>
        </div>
      )),
      <Actions
        key={company._id}
        onView={() => setSelectedCompany(company)}
        onEdit={() => setEditCompany(company)}
        onDelete={() => console.log("Delete clicked")}
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <SearchBox
              placeholder="Search by name or account number..."
              items={[
                ...companies
                  .map((company) => company.companyName || "")
                  .filter(Boolean),
                ...companies.flatMap(
                  (company) =>
                    company.bankDetails
                      ?.map((bank) => bank.accountNumber || "")
                      .filter(Boolean) || []
                ),
              ]}
              onSearch={(filteredItems) => {
                handleSearch(filteredItems);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            <Tables headers={headers} rows={rows} />
            <Pagination
              currentPage={currentPage}
              totalItems={searchResults.length}
              onPageChange={handlePageChange}
            />
          </div>

          {selectedCompany && (
            <PopupBox
              isOpen={true}
              onClose={() => setSelectedCompany(null)}
              title={capitalizeWords(selectedCompany.companyName)}
            >
              <div>
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
                  <strong>Bank Details:</strong>
                </p>
                {formatBankDetails(selectedCompany.bankDetails)?.map(
                  (bank, index) => (
                    <div key={index} className="mb-4 border-b pb-2">
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
                        <strong>Branch Name:</strong> {bank.bankName}
                      </p>
                    </div>
                  )
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
                      company._id === updatedCompany._id ? updatedCompany : company
                    )
                  );
                  setSearchResults((prev) =>
                    prev.map((company) =>
                      company._id === updatedCompany._id ? updatedCompany : company
                    )
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
