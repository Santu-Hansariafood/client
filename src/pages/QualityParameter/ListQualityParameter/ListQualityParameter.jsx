import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddQualityParameter from "../AddQualityParameter/AddQualityParameter";
import EditQualityParameter from "../EditQualityParameter/EditQualityParameter";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import SearchBox from "../../../common/SearchBox/SearchBox";

const ListQualityParameter = () => {
  const [qualityParameters, setQualityParameters] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);

  const headers = ["Name", "Actions"];

  // Fetch Quality Parameters from the API
  useEffect(() => {
    const fetchQualityParameters = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/quality-parameters"
        );
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

  const handleSearch = (searchResults) => {
    setFilteredData(
      qualityParameters.filter((param) =>
        param.name.toLowerCase().includes(searchResults.toLowerCase())
      )
    );
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
        `http://localhost:5000/api/quality-parameters/${updatedData._id}`,
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
      console.log("Deleting ID:", item._id); // Use _id
      await axios.delete(
        `http://localhost:5000/api/quality-parameters/${item._id}`
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

  const rows = filteredData.map((item) => [
    item.name,
    <Actions
      onView={() => handleView(item)}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
    />,
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Quality Parameters</h2>

      <SearchBox
        placeholder="Search by name..."
        items={qualityParameters.map((param) => param.name)}
        onSearch={handleSearch}
      />

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mt-4 mb-6 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
      >
        {showAddForm ? "Cancel" : "Add New Quality Parameter"}
      </button>

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

      <ToastContainer />
    </div>
  );
};

ListQualityParameter.propTypes = {
  onSubmit: PropTypes.func, 
};

export default ListQualityParameter;
