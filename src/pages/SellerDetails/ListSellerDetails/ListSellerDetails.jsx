import { useEffect, useState } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import SearchBox from "../../../common/SearchBox/SearchBox";
import Actions from "../../../common/Actions/Actions";
import Pagination from "../../../common/Paginations/Paginations";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PopupBox from "../../../common/PopupBox/PopupBox";

const ListSellerDetails = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState("view");
  const [selectedSeller, setSelectedSeller] = useState(null);

  const apiBaseURL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get(`${apiBaseURL}/sellers`);
        const sortedData = response.data.sort((a, b) =>
          a.sellerName.localeCompare(b.sellerName)
        );
        setData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        toast.error("Failed to fetch seller data", error);
      }
    };

    fetchSellers();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term) {
      const lowerCaseTerm = term.toLowerCase();
      const filtered = data.filter(
        (item) =>
          item.sellerName.toLowerCase().includes(lowerCaseTerm) ||
          item.phoneNumbers.some((phone) =>
            phone.value.toLowerCase().includes(lowerCaseTerm)
          )
      );
      setFilteredData(filtered);
      setCurrentPage(1);
    } else {
      setFilteredData(data);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewSeller = (seller) => {
    setSelectedSeller(seller);
    setPopupMode("view");
    setIsPopupOpen(true);
  };

  const handleEditSeller = (seller) => {
    setSelectedSeller(seller);
    setPopupMode("edit");
    setIsPopupOpen(true);
  };

  const headers = [
    "S.No",
    "Seller Name",
    "Emails",
    "Phone Numbers",
    "Commodity",
    "Company",
    "Status",
    "Actions",
  ];
  const rows = currentItems.map((item, index) => [
    indexOfFirstItem + index + 1,
    item.sellerName,
    item.emails.map((email) => email.value).join(", "),
    item.phoneNumbers.map((phone) => phone.value).join(", "),
    item.selectedCommodity,
    item.selectedCompany,
    item.selectedStatus,
    <Actions
      key={item._id}
      onView={() => handleViewSeller(item)}
      onEdit={() => handleEditSeller(item)}
      onDelete={() => toast.error(`Delete ${item.sellerName}`)}
    />,
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-16 bg-gray-100 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">Seller List</h1>
      <div className="w-full max-w-4xl mb-4">
        <SearchBox
          placeholder="Search sellers by name or phone..."
          items={data.map((item) => item.sellerName)}
          onSearch={handleSearch}
        />
      </div>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md">
        <Tables headers={headers} rows={rows} />
      </div>
      <div className="w-full max-w-4xl">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

      <PopupBox
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title={popupMode === "view" ? "Seller Details" : "Edit Seller Details"}
      >
        {selectedSeller && (
          <div>
            <p>
              <strong>Name:</strong> {selectedSeller.sellerName}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {selectedSeller.emails.map((email) => email.value).join(", ")}
            </p>
            <p>
              <strong>Phone Numbers:</strong>{" "}
              {selectedSeller.phoneNumbers
                .map((phone) => phone.value)
                .join(", ")}
            </p>
            <p>
              <strong>Commodity:</strong> {selectedSeller.selectedCommodity}
            </p>
            <p>
              <strong>Company:</strong> {selectedSeller.selectedCompany}
            </p>
            <p>
              <strong>Status:</strong> {selectedSeller.selectedStatus}
            </p>

            {popupMode === "edit" && (
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() =>
                    toast.success("Edit functionality coming soon!")
                  }
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </PopupBox>

      <ToastContainer />
    </div>
  );
};

export default ListSellerDetails;
