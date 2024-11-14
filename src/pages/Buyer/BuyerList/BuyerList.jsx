import { useState, useEffect } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import SearchBox from "../../../common/SearchBox/SearchBox";
import Pagination from "../../../common/Paginations/Paginations";
import { toast } from "react-toastify";

const BuyerList = () => {
  const [buyersData, setBuyersData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBuyersData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/buyers");
        const sortedData = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setBuyersData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        toast.error("Failed to fetch buyers data");
        console.error("Error fetching buyers data:", error);
      }
    };
    fetchBuyersData();
  }, []);

  const handleSearch = (filteredItems) => {
    const filtered = buyersData.filter((buyer) =>
      filteredItems.some((item) =>
        Object.values(buyer).some((field) =>
          String(field).toLowerCase().includes(item.toLowerCase())
        )
      )
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleView = (index) => {
    console.log("View details for:", filteredData[index]);
  };

  const handleEdit = (index) => {
    console.log("Edit buyer at index:", index);
  };

  const handleDelete = (index) => {
    const updatedData = filteredData.filter((_, i) => i !== index);
    setFilteredData(updatedData);
    setBuyersData(updatedData);
    toast.success("Buyer deleted successfully");
  };

  // Pagination logic
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = filteredData.slice(firstItemIndex, lastItemIndex);

  const rows = currentItems.map((buyer, index) => [
    firstItemIndex + index + 1, // Serial number based on pagination
    buyer.name,
    buyer.mobile.join(", "),
    buyer.email.join(", "),
    buyer.companyName,
    buyer.commodity.join(", "),
    buyer.status,
    <Actions
      key={index}
      onView={() => handleView(index)}
      onEdit={() => handleEdit(index)}
      onDelete={() => handleDelete(index)}
    />,
  ]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Buyer List</h2>
      <SearchBox
        placeholder="Search buyers..."
        items={buyersData.flatMap((buyer) => Object.values(buyer))}
        onSearch={handleSearch}
      />
      <div className="overflow-x-auto">
        <Tables
          headers={[
            "Sl No",
            "Name",
            "Mobile",
            "Email",
            "Company Name",
            "Commodity",
            "Status",
            "Actions",
          ]}
          rows={rows}
          className="w-full border border-gray-300 text-left bg-white shadow-md rounded-lg overflow-hidden"
        />
      </div>
      <Pagination
        currentPage={currentPage}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default BuyerList;
