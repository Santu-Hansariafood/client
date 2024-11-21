import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const EditBuyerPopup = lazy(() => import("../EditBuyerPopup/EditBuyerPopup"));
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";

const BuyerList = () => {
  const [buyersData, setBuyersData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
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
    setSelectedBuyer(filteredData[index]);
    setIsPopupOpen(true);
  };

  const handleEdit = (index) => {
    setSelectedBuyer(filteredData[index]);
    setIsEditPopupOpen(true);
  };

  const handleDelete = (index) => {
    const updatedData = filteredData.filter((_, i) => i !== index);
    setFilteredData(updatedData);
    setBuyersData(updatedData);
    toast.success("Buyer deleted successfully");
  };

  const handleUpdate = (updatedBuyer) => {
    // Update buyersData and filteredData with the edited buyer
    const updateDataList = (list) =>
      list.map((buyer) =>
        buyer._id === updatedBuyer._id ? updatedBuyer : buyer
      );
  
    setBuyersData(updateDataList(buyersData));
    setFilteredData(updateDataList(filteredData));
  
    // Close the edit popup and provide feedback
    setIsEditPopupOpen(false);
    toast.success("Buyer updated successfully");
  };
  

  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = filteredData.slice(firstItemIndex, lastItemIndex);

  const rows = currentItems.map((buyer, index) => [
    firstItemIndex + index + 1,
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
    <Suspense fallback={<Loading />}>
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
        <PopupBox
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title="Buyer Details"
        >
          {selectedBuyer && (
            <div className="space-y-4">
              <p>
                <strong>Name:</strong> {selectedBuyer.name}
              </p>
              <p>
                <strong>Mobile:</strong> {selectedBuyer.mobile.join(", ")}
              </p>
              <p>
                <strong>Email:</strong> {selectedBuyer.email.join(", ")}
              </p>
              <p>
                <strong>Company Name:</strong> {selectedBuyer.companyName}
              </p>
              <p>
                <strong>Commodity:</strong> {selectedBuyer.commodity.join(", ")}
              </p>
              <p>
                <strong>Status:</strong> {selectedBuyer.status}
              </p>
            </div>
          )}
        </PopupBox>
        <EditBuyerPopup
          buyer={selectedBuyer}
          isOpen={isEditPopupOpen}
          onClose={() => setIsEditPopupOpen(false)}
          onUpdate={handleUpdate}
        />
      </div>
    </Suspense>
  );
};

export default BuyerList;
