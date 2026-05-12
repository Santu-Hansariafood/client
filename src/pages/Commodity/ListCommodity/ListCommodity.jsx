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
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const EditCommodityPopup = lazy(
  () => import("../EditCommodityPopup/EditCommodityPopup"),
);

const ListCommodity = () => {
  const [commodities, setCommodities] = useState([]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCommodities = async () => {
    try {
      setIsLoading(true);

      const response = await axios.get("/commodities", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
        },
      });

      const items = response.data?.data || response.data || [];

      const sortedCommodities = [...items].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );

      setCommodities(sortedCommodities);

      setTotal(response.data?.total || sortedCommodities.length);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error fetching commodities",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommodities();
  }, [currentPage, searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query || "");
    setCurrentPage(1);
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(`/commodities/${id}`);

      setSelectedCommodity(response.data);

      setIsPopupOpen(true);
    } catch (error) {
      toast.error("Error fetching commodity details");
      console.error(error);
    }
  };

  const handleEdit = (id) => {
    setSelectedCommodity({ _id: id });

    setIsEditPopupOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this commodity?",
      );

      if (!confirmDelete) return;

      await axios.delete(`/commodities/${id}`);

      const updatedCommodities = commodities.filter(
        (commodity) => commodity._id !== id,
      );

      setCommodities(updatedCommodities);

      setTotal((prev) => Math.max(prev - 1, 0));

      toast.success("Commodity deleted successfully!");

      if (updatedCommodities.length === 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error deleting commodity");
    }
  };

  const tableRows = useMemo(
    () =>
      commodities.map((commodity, index) => [
        ((Number(currentPage) || 1) - 1) * itemsPerPage + index + 1,

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
      ]),
    [commodities, currentPage],
  );

  const tableHeaders = [
    "Sl No",
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
            <div className="mb-6 flex justify-between items-center">
              <SearchBox
                placeholder="Search Commodities"
                items={commodities.map((commodity) => commodity.name || "")}
                onSearch={handleSearch}
                returnQuery
              />
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loading />
              </div>
            ) : commodities.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <Tables headers={tableHeaders} rows={tableRows} />
                </div>
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={Number(currentPage)}
                    totalItems={Number(total)}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(page) => setCurrentPage(Number(page))}
                  />
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-gray-500 font-medium">
                No commodities found.
              </div>
            )}
            <PopupBox
              isOpen={isPopupOpen}
              onClose={() => setIsPopupOpen(false)}
              title="Commodity Details"
            >
              {selectedCommodity && (
                <div className="space-y-3">
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
                commodityId={selectedCommodity?._id || null}
                onUpdate={fetchCommodities}
              />
            )}
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ListCommodity;
