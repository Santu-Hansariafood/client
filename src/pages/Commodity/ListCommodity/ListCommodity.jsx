import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaCubes } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const EditCommodityPopup = lazy(() =>
  import("../EditCommodityPopup/EditCommodityPopup")
);

const ListCommodity = () => {
  const [commodities, setCommodities] = useState([]);
  const [filteredCommodities, setFilteredCommodities] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const response = await axios.get("/commodities");
        const items = response.data?.data || response.data || [];
        const sortedCommodities = items.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCommodities(sortedCommodities);
        setFilteredCommodities(sortedCommodities);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Error fetching commodities");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommodities();
  }, []);

  const handleSearch = (filteredNames) => {
    if (filteredNames.length === 0) {
      setFilteredCommodities([...commodities]);
    } else {
      const results = commodities.filter((commodity) =>
        filteredNames.includes(commodity.name)
      );
      setFilteredCommodities(results);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(`/commodities/${id}`);
      setSelectedCommodity(response.data);
      setIsPopupOpen(true);
    } catch (error) {
      toast.error("Error fetching commodity details:", error);
    }
  };

  const handleEdit = (id) => {
    setSelectedCommodity({ _id: id });
    setIsEditPopupOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this commodity?"
      );
      if (!confirmDelete) return;

      await axios.delete(`/commodities/${id}`);

      const updatedCommodities = commodities.filter(
        (commodity) => commodity._id !== id
      );
      setCommodities(updatedCommodities);
      setFilteredCommodities(updatedCommodities);

      toast.success("Commodity deleted successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error deleting commodity");
    }
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCommodities.slice(start, start + itemsPerPage);
  }, [filteredCommodities, currentPage]);

  const tableRows = paginatedData.map((commodity, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    commodity.name || "N/A",
    commodity.hsnCode || "N/A",
    Array.isArray(commodity.parameters)
      ? commodity.parameters.map((param) => param.parameter).join(", ")
      : "N/A",
    <Actions
      key={commodity._id}
      onView={() => handleView(commodity._id)}
      onEdit={() => handleEdit(commodity._id)}
      onDelete={() => handleDelete(commodity._id)}
    />,
  ]);

  const tableHeaders = [
    "Serial No.",
    "Commodity Name",
    "HSN Code",
    "Parameters",
    "Actions",
  ];

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Commodity List"
        subtitle="Manage commodities with HSN codes and parameters"
        icon={FaCubes}
        noContentCard
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-amber-200/80 rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-slate-800">
              Commodity List
            </h2>
              <div className="mb-6 flex justify-between items-center">
                <SearchBox
                  placeholder="Search Commodities"
                  items={commodities.map((commodity) => commodity.name || "")}
                  onSearch={handleSearch}
                />
              </div>
              {filteredCommodities.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <Tables headers={tableHeaders} rows={tableRows} />
                  </div>
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={filteredCommodities.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <p>No commodities found.</p>
              )}
              <PopupBox
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title="Commodity Details"
              >
            {selectedCommodity && (
              <div>
                <p>
                  <strong>Name:</strong> {selectedCommodity.name || "N/A"}
                </p>
                <p>
                  <strong>HSN Code:</strong>{" "}
                  {selectedCommodity.hsnCode || "N/A"}
                </p>
                <p>
                  <strong>Parameters:</strong>{" "}
                  {selectedCommodity.parameters
                    ? selectedCommodity.parameters
                        .map((param) => param.parameter)
                        .join(", ")
                    : "N/A"}
                </p>
              </div>
            )}
              </PopupBox>
              {isEditPopupOpen && (
                <EditCommodityPopup
                  isOpen={isEditPopupOpen}
                  onClose={() => setIsEditPopupOpen(false)}
                  commodityId={selectedCommodity ? selectedCommodity._id : null}
                  onUpdate={() => {
                    axios.get("/commodities").then((response) => {
                      const sortedCommodities = response.data.sort((a, b) =>
                        a.name.localeCompare(b.name)
                      );
                      setCommodities(sortedCommodities);
                      setFilteredCommodities(sortedCommodities);
                    });
                  }}
                />
              )}
            </div>
          </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ListCommodity;
