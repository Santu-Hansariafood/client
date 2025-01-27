import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const EditCompanyPopup = lazy(() =>
  import("../EditCompanyPopup/EditCompanyPopup")
);

const ListCompany = () => {
  const [companyData, setCompanyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get("https://phpserver-v77g.onrender.com/api/companies");

        const sortedData = response.data.sort((a, b) => {
          if (a.group === b.group) {
            return a.companyName.localeCompare(b.companyName);
          }
          return a.group.localeCompare(b.group);
        });

        setCompanyData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        console.error("Error fetching company data:", error);
        toast.error("Failed to fetch company data");
      }
    };

    fetchCompanyData();
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = companyData.filter(
      (company) =>
        company.companyName.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, companyData]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleView = (index) => {
    setSelectedCompany(paginatedData[index]);
    setIsPopupOpen(true);
  };

  const handleEdit = (index) => {
    setSelectedCompany(paginatedData[index]);
    setIsEditPopupOpen(true);
  };

  const handleDelete = async (index) => {
    const companyId = paginatedData[index]._id;
    try {
      await axios.delete(`https://phpserver-v77g.onrender.com/api/companies/${companyId}`);
      const updatedData = filteredData.filter(
        (company) => company._id !== companyId
      );
      setFilteredData(updatedData);
      setCompanyData(updatedData);
      toast.success("Company deleted successfully");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    }
  };

  const handleUpdate = (updatedCompany) => {
    const updatedList = companyData.map((company) =>
      company._id === updatedCompany._id ? updatedCompany : company
    );
    setCompanyData(updatedList);
    setFilteredData(updatedList);
  };

  const rows = paginatedData.map((company, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    company.companyName,
    company.companyEmail,
    company.consignee.join(", "),
    company.group,
    company.commodities.map((commodity) => commodity.name).join(", "),
    company.commodities
      .map((commodity) =>
        commodity.parameters
          .map((param) => `${param.parameter}: ${param.value}`)
          .join(", ")
      )
      .join(" | "),
    company.mandiLicense || "N/A",
    company.activeStatus ? "Active" : "Inactive",
    <Actions
      key={index}
      onView={() => handleView(index)}
      onEdit={() => handleEdit(index)}
      onDelete={() => handleDelete(index)}
    />,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4 text-center text-blue-500">List of Companies</h2>
        <SearchBox
          placeholder="Search companies by name..."
          onSearch={(term) => setSearchTerm(term)}
        />
        <Tables
          headers={[
            "Sl No",
            "Company Name",
            "Email",
            "Consignee",
            "Group",
            "Commodity",
            "Quality Parameter",
            "Mandi License",
            "Status",
            "Actions",
          ]}
          rows={rows}
        />
        <Pagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
        {isPopupOpen && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={selectedCompany?.companyName || "Company Details"}
          >
            {selectedCompany && (
              <div>
                <p>
                  <strong>Company Name:</strong> {selectedCompany.companyName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedCompany.companyEmail}
                </p>
                <p>
                  <strong>Consignee:</strong> {selectedCompany.consignee.join(", ")}
                </p>
                <p>
                  <strong>Group:</strong> {selectedCompany.group}
                </p>
                <h4 className="mt-4 font-semibold">Commodities:</h4>
                <ul>
                  {selectedCompany.commodities.map((commodity) => (
                    <li key={commodity._id}>
                      <strong>{commodity.name}</strong>: {" "}
                      {commodity.parameters
                        .map((param) => `${param.parameter}: ${param.value} %`)
                        .join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </PopupBox>
        )}
        {isEditPopupOpen && (
          <EditCompanyPopup
            isOpen={isEditPopupOpen}
            company={selectedCompany}
            onClose={() => setIsEditPopupOpen(false)}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </Suspense>
  );
};

export default ListCompany;
