import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import { FaUsers } from "react-icons/fa";
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);
import "../../../common/AdminPageShell/AdminPageShell";
const AddQualityParameter = lazy(
  () => import("../AddQualityParameter/AddQualityParameter"),
);
const EditQualityParameter = lazy(
  () => import("../EditQualityParameter/EditQualityParameter"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);

const ListQualityParameter = () => {
  const [qualityParameters, setQualityParameters] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const headers = ["Sl No", "Name", "Actions"];

  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchQualityParameters = async () => {
    try {
      const response = await api.get("/quality-parameters", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
        },
      });
      const data = response.data?.data || response.data || [];
      setQualityParameters(data);
      setFilteredData(data);
      setTotal(response.data?.total ?? data.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch quality parameters.");
    }
  };

  useEffect(() => {
    fetchQualityParameters();
  }, [currentPage, searchQuery]);

  const handleAddQualityParameter = (newData) => {
    setQualityParameters([...qualityParameters, newData]);
    setFilteredData([...qualityParameters, newData]);
    setShowAddForm(false);
    toast.success("Quality parameter added successfully!");
  };

  const handleSearch = (query) => {
    setSearchQuery(query || "");
    setCurrentPage(1);
  };

  const handleView = (item) => {
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setIsEditPopupVisible(true);
  };

  const handleUpdateQualityParameter = async (updatedData) => {
    try {
      const response = await api.put(
        `/quality-parameters/${updatedData._id}`,
        updatedData,
      );
      clearApiCache();
      fetchQualityParameters();
      toast.success("Quality parameter updated successfully!");
      setIsEditPopupVisible(false);
      setEditItem(null);
    } catch (error) {
      toast.error("Failed to update quality parameter.");
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(`/quality-parameters/${item._id}`);
      clearApiCache();
      setQualityParameters((prev) =>
        prev.filter((param) => param._id !== item._id),
      );
      setFilteredData((prev) => prev.filter((param) => param._id !== item._id));
      toast.success("Quality parameter deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete quality parameter.");
    }
  };

  const rows = useMemo(
    () =>
      filteredData.map((item, index) => [
        (Number(currentPage) - 1) * itemsPerPage + index + 1,
        item.name,
        <Actions
          key={item._id}
          onView={() => handleView(item)}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item)}
        />,
      ]),
    [filteredData, currentPage]
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="mx-auto w-full max-w-5xl">
        <AdminPageShell
          title="Quality Parameter List"
          subtitle="Search and manage all quality parameters"
          icon={FaUsers}
          noContentCard
        >
          <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:max-w-md">
              <SearchBox
                placeholder="Search by name..."
                items={qualityParameters.map((param) => param.name)}
                onSearch={handleSearch}
                returnQuery
              />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-lux-emerald/20 transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
            >
              {showAddForm ? "Cancel" : "Add New Quality Parameter"}
            </button>
          </div>
          {showAddForm && (
            <AddQualityParameter onSubmit={handleAddQualityParameter} />
          )}

          {isEditPopupVisible && editItem && (
            <EditQualityParameter
              item={editItem}
              onClose={() => setIsEditPopupVisible(false)}
              onSubmit={handleUpdateQualityParameter}
            />
          )}

          <Tables headers={headers} rows={rows} />

          <Pagination
            currentPage={Number(currentPage)}
            totalItems={Number(total)}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(Number(page))}
          />
          </div>
        </AdminPageShell>
      </div>
    </Suspense>
  );
};

ListQualityParameter.propTypes = {
  onSubmit: PropTypes.func,
};

export default ListQualityParameter;
