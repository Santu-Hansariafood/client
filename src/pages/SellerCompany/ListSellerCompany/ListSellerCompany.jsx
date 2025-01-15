import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
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
        const response = await axios.get(
          "https://phpserver-v77g.onrender.com/api/seller-company"
        );
        setCompanies(response.data.data);
        setSearchResults(response.data.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch companies",err);
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleSearch = (filteredItems) => {
    setSearchResults(filteredItems);
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
      company.companyName,
      company.gstNo,
      company.panNo,
      company.aadhaarNo,
      company.address,
      company.state,
      company.district,
      company.msmeNo || "-",
      company.bankDetails?.map((bank, index) => (
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
        </div>
      )),
      <Actions
        onView={() => setSelectedCompany(company)}
        onEdit={() => setEditCompany(company)}
        onDelete={() => console.log("Delete clicked")}
      />,
    ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 sm:p-6 md:p-10 lg:p-16 bg-gray-100 flex justify-center items-center">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">
            Seller Company List
          </h2>
          <SearchBox
            placeholder="Search by Name or Mobile Number"
            items={companies.map(
              (company) =>
                company.companyName +
                company.bankDetails
                  ?.map((bank) => bank.accountNumber)
                  .join(", ")
            )}
            onSearch={handleSearch}
          />
          <Tables headers={headers} rows={rows} />
          <Pagination
            currentPage={currentPage}
            totalItems={searchResults.length}
            onPageChange={handlePageChange}
          />
          {selectedCompany && (
            <PopupBox
              isOpen={true}
              onClose={() => setSelectedCompany(null)}
              title={selectedCompany.companyName}
            >
              <div>
                <p>
                  <strong>GST No:</strong> {selectedCompany.gstNo}
                </p>
                <p>
                  <strong>PAN No:</strong> {selectedCompany.panNo}
                </p>
                <p>
                  <strong>Aadhaar No:</strong> {selectedCompany.aadhaarNo}
                </p>
                <p>
                  <strong>Address:</strong> {selectedCompany.address}
                </p>
                <p>
                  <strong>State:</strong> {selectedCompany.state}
                </p>
                <p>
                  <strong>District:</strong> {selectedCompany.district}
                </p>
                {selectedCompany.msmeNo && (
                  <p>
                    <strong>MSME No:</strong> {selectedCompany.msmeNo}
                  </p>
                )}
                <p>
                  <strong>Bank Details:</strong>
                </p>
                {selectedCompany.bankDetails?.map((bank, index) => (
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
                  </div>
                ))}
                <button
                  onClick={() => generatePDF(selectedCompany)}
                  className="bg-green-500 text-white py-2 px-4 rounded-lg mt-4"
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
                      company.id === updatedCompany.id
                        ? updatedCompany
                        : company
                    )
                  );
                  setEditCompany(null);
                }}
                onCancel={() => setEditCompany(null)}
              />
            </PopupBox>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default ListSellerCompany;
