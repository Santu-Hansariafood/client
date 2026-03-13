import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBuilding } from "react-icons/fa";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
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

  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/companies", {
          params: { page: currentPage, limit: itemsPerPage },
        });

        const items = response.data?.data || [];
        const total = response.data?.total ?? items.length;

        setCompanyData(items);
        setFilteredData(items);
        setTotalItems(total);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch company data");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [currentPage]);

  const handleView = (index) => {
    setSelectedCompany(companyData[index]);
    setIsPopupOpen(true);
  };

  const handleEdit = (index) => {
    setSelectedCompany(companyData[index]);
    setIsEditPopupOpen(true);
  };

  const handleDelete = async (index) => {
    const companyId = companyData[index]._id;
    try {
      await axios.delete(`/companies/${companyId}`);
      const nextTotal = Math.max(0, totalItems - 1);
      const totalPages = Math.max(1, Math.ceil(nextTotal / itemsPerPage));
      const nextPage = Math.min(currentPage, totalPages);
      setCurrentPage(nextPage);
      toast.success("Company deleted successfully");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    }
  };

  const handleUpdate = (updatedCompany) => {
    const updatedId = updatedCompany?._id || updatedCompany?.id;
    const updatedList = companyData.map((company) => {
      if ((company._id || company.id) === updatedId) {
        return {
          ...company,
          ...updatedCompany,
          group: updatedCompany.group || company.group,
          consignee: Array.isArray(updatedCompany.consignee)
            ? updatedCompany.consignee
            : company.consignee,
          commodities: Array.isArray(updatedCompany.commodities)
            ? updatedCompany.commodities
            : company.commodities,
        };
      }
      return company;
    });
    setCompanyData(updatedList);
    setFilteredData(updatedList);
    setSelectedCompany((prev) => {
      if (!prev) return prev;
      if ((prev._id || prev.id) !== updatedId) return prev;
      return {
        ...prev,
        ...updatedCompany,
        group: updatedCompany.group || prev.group,
        consignee: Array.isArray(updatedCompany.consignee)
          ? updatedCompany.consignee
          : prev.consignee,
        commodities: Array.isArray(updatedCompany.commodities)
          ? updatedCompany.commodities
          : prev.commodities,
      };
    });
  };

  const rows = companyData.map((company, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    company.companyName,
    company.companyEmail,
    Array.isArray(company.consignee)
      ? company.consignee
          .map((c) => (typeof c === "string" ? c : c?.name || ""))
          .filter(Boolean)
          .join(", ")
      : "",
    company.group,
    Array.isArray(company.commodities)
      ? company.commodities.map((commodity) => commodity.name).join(", ")
      : "",
    Array.isArray(company.commodities)
      .map((commodity) =>
        (commodity.parameters || [])
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
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                {loading && <Loading />}
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
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                  }}
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
                  {Array.isArray(selectedCompany.consignee)
                    ? selectedCompany.consignee
                        .map((c) => (typeof c === "string" ? c : c?.name || ""))
                        .filter(Boolean)
                        .join(", ")
                    : ""}
                </p>
                <p>
                  <strong>Group:</strong> {selectedCompany.group}
                </p>
                <h4 className="mt-4 font-semibold">Commodities:</h4>
                <ul>
                  {(selectedCompany.commodities || []).map((commodity) => (
                    <li key={commodity._id}>
                      <strong>{commodity.name}</strong>:{" "}
                      {(commodity.parameters || [])
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
