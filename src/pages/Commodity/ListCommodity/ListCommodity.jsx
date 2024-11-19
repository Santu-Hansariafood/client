import { useState, useEffect } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import SearchBox from "../../../common/SearchBox/SearchBox";
import PopupBox from "../../../common/PopupBox/PopupBox";

const ListCommodity = () => {
  const [commodities, setCommodities] = useState([]);
  const [filteredCommodities, setFilteredCommodities] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/commodities"
        );
        const sortedCommodities = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCommodities(sortedCommodities);
        setFilteredCommodities(sortedCommodities);
      } catch (error) {
        console.error("Error fetching commodities:", error);
      }
    };

    fetchCommodities();
  }, []);

  const handleSearch = (searchTerm) => {
    if (searchTerm === "") {
      setFilteredCommodities(commodities);
    } else {
      const filteredData = commodities.filter((commodity) =>
        commodity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommodities(filteredData);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/commodities/${id}`);
      setSelectedCommodity(response.data);
      setIsPopupOpen(true);
    } catch (error) {
      console.error("Error fetching commodity details:", error);
    }
  };

  const handleEdit = (id) => {
    console.log("Editing commodity with ID:", id);
  };

  const handleDelete = (id) => {
    console.log("Deleting commodity with ID:", id);
  };

  const tableRows = filteredCommodities.map((commodity, index) => [
    index + 1,
    commodity.name,
    commodity.hsnCode,
    commodity.parameters.join(", "),
    commodity.activeStatus,
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
    "Active Status",
    "Actions",
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6 border-2 border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">Commodity List</h2>

        {/* Search Box */}
        <div className="mb-6 flex justify-between items-center">
          <SearchBox
            placeholder="Search Commodities"
            items={commodities.map((commodity) => commodity.name)}
            onSearch={handleSearch}
          />
        </div>

        {/* Table */}
        <Tables headers={tableHeaders} rows={tableRows} />

        {/* PopupBox */}
        <PopupBox
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title="Commodity Details"
        >
          {selectedCommodity ? (
            <div>
              <p><strong>Name:</strong> {selectedCommodity.name}</p>
              <p><strong>HSN Code:</strong> {selectedCommodity.hsnCode}</p>
              <p><strong>Parameters:</strong> {selectedCommodity.parameters.join(", ")}</p>
              <p><strong>Active Status:</strong> {selectedCommodity.activeStatus ? "Active" : "Inactive"}</p>
            </div>
          ) : (
            <p>Loading details...</p>
          )}
        </PopupBox>
      </div>
    </div>
  );
};

export default ListCommodity;
