import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const EditCompanyPopup = lazy(() =>
  import("../EditCompanyPopup/EditCompanyPopup")
);
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";

const ListCompany = () => {
  const [companyData, setCompanyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/companies");
        const sortedData = response.data.sort((a, b) =>
          a.companyName.localeCompare(b.companyName)
        );
        setCompanyData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        console.error("Error fetching company data:", error);
        toast.error("Failed to fetch company data");
      }
    };

    fetchCompanyData();
  }, []);

  const handleSearch = (searchTerm) => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    setFilteredData(
      companyData.filter(
        (company) =>
          company.companyName.toLowerCase().includes(lowercasedSearchTerm) ||
          company.companyPhone.toLowerCase().includes(lowercasedSearchTerm)
      )
    );
  };

  const handleView = (index) => {
    setSelectedCompany(filteredData[index]);
    setIsPopupOpen(true);
  };

  const handleEdit = (index) => {
    setSelectedCompany(filteredData[index]);
    setIsEditPopupOpen(true);
  };

  const handleDelete = async (index) => {
    const companyId = filteredData[index]._id;
    try {
      await axios.delete(`http://localhost:5000/api/companies/${companyId}`);
      const updatedData = filteredData.filter((_, i) => i !== index);
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

  const rows = filteredData.map((company, index) => [
    index + 1,
    company.companyName,
    company.companyPhone,
    company.companyEmail,
    company.consignee.join(", "),
    company.group,
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
        <h2 className="text-2xl font-semibold mb-4">List of Companies</h2>
        <SearchBox
          placeholder="Search companies..."
          items={companyData.map((company) => company.companyName)}
          onSearch={handleSearch}
        />
        <Tables
          headers={[
            "Sl No",
            "Company Name",
            "Phone Number",
            "Email",
            "Consignee",
            "Group",
            "Quality Parameter",
            "Mandi License",
            "Status",
            "Actions",
          ]}
          rows={rows}
        />
        {isPopupOpen && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={selectedCompany?.companyName || "Company Details"}
          ></PopupBox>
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
