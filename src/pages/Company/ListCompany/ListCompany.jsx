import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBuilding } from "react-icons/fa";
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get("/companies");

        const items = response.data?.data || response.data || [];
        const sortedData = items.sort((a, b) => {
          if (a.group === b.group) {
            return a.companyName.localeCompare(b.companyName);
          }
          return a.group.localeCompare(b.group);
        });

        setCompanyData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch company data");
      }
    };

    fetchCompanyData();
  }, []);

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
      await axios.delete(`/companies/${companyId}`);
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
          .filter((param) => param.value !== "0")
          .map((param) => `${param.parameter}: ${param.value}`)
          .join(", ")
      )
      .filter((entry) => entry !== "")
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
      <AdminPageShell
        title="Company List"
        subtitle="List of companies with group and consignee"
        icon={FaBuilding}
        noContentCard
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-amber-200/80 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="mb-4">
              <SearchBox
                placeholder="Search companies by name..."
                items={companyData.map((c) => c.companyName || "")}
                onSearch={(filteredNames) => {
                  if (!filteredNames || filteredNames.length === 0) {
                    setFilteredData(companyData);
                    setCurrentPage(1);
                    return;
                  }
                  if (filteredNames.length === companyData.length) {
                    setFilteredData(companyData);
                    setCurrentPage(1);
                    return;
                  }
                  const nameSet = new Set(filteredNames);
                  setFilteredData(
                    companyData.filter((c) => nameSet.has(c.companyName))
                  );
                  setCurrentPage(1);
                }}
              />
            </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
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
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </div>
          </div>
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
                  <strong>Consignee:</strong>{" "}
                  {selectedCompany.consignee.join(", ")}
                </p>
                <p>
                  <strong>Group:</strong> {selectedCompany.group}
                </p>
                <h4 className="mt-4 font-semibold">Commodities:</h4>
                <ul>
                  {selectedCompany.commodities.map((commodity) => (
                    <li key={commodity._id}>
                      <strong>{commodity.name}</strong>:{" "}
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
      </AdminPageShell>
    </Suspense>
  );
};

export default ListCompany;
