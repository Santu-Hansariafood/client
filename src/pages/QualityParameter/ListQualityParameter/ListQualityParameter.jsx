import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import { FaUsers } from "react-icons/fa";
const AdminPageShell = lazy(() =>
  import("../../../common/AdminPageShell/AdminPageShell")
);
import"../../../common/AdminPageShell/AdminPageShell";
const AddQualityParameter = lazy(() =>
  import("../AddQualityParameter/AddQualityParameter")
);
const EditQualityParameter = lazy(() =>
  import("../EditQualityParameter/EditQualityParameter")
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
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

  useEffect(() => {
    const fetchQualityParameters = async () => {
      try {
        const response = await axios.get("/quality-parameters");
        setQualityParameters(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch quality parameters.");
      }
    };
    fetchQualityParameters();
  }, []);

  const handleAddQualityParameter = (newData) => {
    setQualityParameters([...qualityParameters, newData]);
    setFilteredData([...qualityParameters, newData]);
    setShowAddForm(false);
    toast.success("Quality parameter added successfully!");
  };

  const handleSearch = (filteredNames) => {
    if (filteredNames.length === 0) {
      setFilteredData([...qualityParameters]);
    } else {
      const results = qualityParameters.filter((param) =>
        filteredNames.includes(param.name)
      );
      setFilteredData(results);
    }
    setCurrentPage(1);
  };
  

  const handleView = (item) => {
    console.log("Viewing:", item);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setIsEditPopupVisible(true);
  };

  const handleUpdateQualityParameter = async (updatedData) => {
    try {
      const response = await axios.put(
        `/quality-parameters/${updatedData._id}`,
        updatedData
      );
      setQualityParameters((prev) =>
        prev.map((param) =>
          param._id === updatedData._id ? response.data : param
        )
      );
      setFilteredData((prev) =>
        prev.map((param) =>
          param._id === updatedData._id ? response.data : param
        )
      );
      toast.success("Quality parameter updated successfully!");
      setIsEditPopupVisible(false);
      setEditItem(null);
    } catch (error) {
      console.error("Error updating parameter:", error.response || error);
      toast.error("Failed to update quality parameter.");
    }
  };

  const handleDelete = async (item) => {
    try {
      console.log("Deleting ID:", item._id);
      await axios.delete(
        `/quality-parameters/${item._id}`
      );
      setQualityParameters((prev) =>
        prev.filter((param) => param._id !== item._id)
      );
      setFilteredData((prev) => prev.filter((param) => param._id !== item._id));
      toast.success("Quality parameter deleted successfully!");
    } catch (error) {
      console.error("Error deleting parameter:", error.response || error);
      toast.error("Failed to delete quality parameter.");
    }
  };

  const rows = filteredData
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((item, index) => [
      (currentPage - 1) * itemsPerPage + index + 1,
      item.name,
      <Actions
        key={item._id}
        onView={() => handleView(item)}
        onEdit={() => handleEdit(item)}
        onDelete={() => handleDelete(item)}
      />,
    ]);

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
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />

        <ToastContainer />
      </AdminPageShell>
      </div>
    </Suspense>
  );
};

ListQualityParameter.propTypes = {
  onSubmit: PropTypes.func,
};

export default ListQualityParameter;
