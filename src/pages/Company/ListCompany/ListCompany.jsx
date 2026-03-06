import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
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
const DashboardLayout = lazy(() =>
  import("../../../layouts/DashboardLayout/DashboardLayout")
);
const Header = lazy(() => import("../../../common/Header/Header"));
const LogoutConfirmationModal = lazy(() =>
  import("../../../common/LogoutConfirmationModal/LogoutConfirmationModal")
);

const ListCompany = () => {
  const [companyData, setCompanyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const { logout } = useAuth();

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

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = companyData.filter((company) =>
      company.companyName.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, companyData]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/", { replace: true });
  }, [logout, navigate]);

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
      <DashboardLayout>
        <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
        <main className="min-h-screen px-4 sm:px-6 py-10 bg-green-50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white border border-yellow-300 rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-3xl font-extrabold mb-6 text-center text-green-800">
                List of Companies
              </h2>
              <div className="mb-4">
                <SearchBox
                  placeholder="Search companies by name..."
                  onSearch={(term) => setSearchTerm(term)}
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
        </main>
        {showLogoutConfirmation && (
          <LogoutConfirmationModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirmation(false)}
          />
        )}
      </DashboardLayout>
    </Suspense>
  );
};

export default ListCompany;
