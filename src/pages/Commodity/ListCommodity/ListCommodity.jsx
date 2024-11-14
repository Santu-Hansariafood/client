import { useState, useEffect } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import SearchBox from "../../../common/SearchBox/SearchBox";

const ListCommodity = () => {
  const [commodities, setCommodities] = useState([]);
  const [filteredCommodities, setFilteredCommodities] = useState([]);

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

  const handleView = (id) => {
    console.log("Viewing commodity with ID:", id);
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
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Commodity List
        </h2>

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
      </div>
    </div>
  );
};

export default ListCommodity;
