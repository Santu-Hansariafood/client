import React, { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddQualityParameter from "../AddQualityParameter/AddQualityParameter";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import SearchBox from "../../../common/SearchBox/SearchBox";

const ListQualityParameter = () => {
  const [qualityParameters, setQualityParameters] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Updated headers to only include "Name" and "Actions"
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
    console.log("Editing:", item);
  };

  const handleDelete = async (item) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/quality-parameters/${item.id}`
      );
      setQualityParameters((prev) =>
        prev.filter((param) => param.id !== item.id)
      );
      setFilteredData((prev) => prev.filter((param) => param.id !== item.id));
      toast.success("Quality parameter deleted successfully!");
    } catch (error) {
      console.error("Error deleting parameter:", error);
      toast.error("Failed to delete quality parameter.");
    }
  };

  // Updated rows to only include the "Name" and "Actions" columns
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

      <Tables headers={headers} rows={rows} />

      <ToastContainer />
    </div>
  );
};

ListQualityParameter.propTypes = {
  onSubmit: PropTypes.func,
};

export default ListQualityParameter;
