import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import api from "../../../utils/apiClient/apiClient";
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
      <div className="p-6 max-w-4xl mx-auto">
        <AdminPageShell
          title="Quality Parameter List"
          subtitle="Search and manage all quality parameters"
          icon={FaUsers}
          noContentCard
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="w-full md:w-1/2">
              <SearchBox
                placeholder="Search by name..."
                items={qualityParameters.map((param) => param.name)}
                onSearch={handleSearch}
                returnQuery
              />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition whitespace-nowrap"
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
        </AdminPageShell>
      </div>
    </Suspense>
  );
};

ListQualityParameter.propTypes = {
  onSubmit: PropTypes.func,
};

export default ListQualityParameter;
