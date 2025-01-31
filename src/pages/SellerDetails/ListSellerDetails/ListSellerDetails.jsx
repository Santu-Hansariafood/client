import { lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const EditSellerDetails = lazy(() =>
  import("../EditSellerDetails/EditSellerDetails")
);

// Utility function to convert a string to Title Case
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ListSellerDetails = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState("view");
  const [selectedSeller, setSelectedSeller] = useState(null);

  const apiBaseURL = "https://phpserver-v77g.onrender.com/api";

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get(`${apiBaseURL}/sellers`);
        // Format seller names and company names to Title Case
        const formattedData = response.data.map((seller) => ({
          ...seller,
          sellerName: toTitleCase(seller.sellerName),
          companies: seller.companies.map((company) => toTitleCase(company)),
          emails: seller.emails.map((email) => email.value.toLowerCase()), // Emails in lowercase
        }));
        const sortedData = formattedData.sort((a, b) =>
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

  const handleEditSeller = (seller) => {
    setSelectedSeller({
      ...seller,
      phoneNumbers: seller.phoneNumbers || [],
      emails: seller.emails || [],
      commodities: seller.commodities || [],
      selectedCompany: seller.selectedCompany || [],
      buyers: seller.buyers || [],
    });
    setPopupMode("edit");
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedSeller(null);
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

  const rows = filteredData
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((item, index) => [
      (currentPage - 1) * itemsPerPage + index + 1,
      item.sellerName, // Already formatted to Title Case
      item.emails.join(", "), // Emails already in lowercase
      item.phoneNumbers.map((phone) => phone.value).join(", "),
      item.commodities
        .map(
          (commodity) =>
            `${toTitleCase(commodity.name)} (Brokerage: ₹${
              commodity.brokerage
            } per ton)`
        )
        .join(", "),
      item.companies.join(", "), // Already formatted to Title Case
      toTitleCase(item.selectedStatus), // Status in Title Case
      <Actions
        key={item._id}
        onView={() => {
          setSelectedSeller(item);
          setPopupMode("view");
          setIsPopupOpen(true);
        }}
        onEdit={() => handleEditSeller(item)}
        onDelete={() => toast.error(`Delete ${item.sellerName}`)}
      />,
    ]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 sm:p-6 md:p-10 lg:p-16 bg-gray-100 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-700">Seller List</h1>
        <div className="w-full max-w-4xl mb-4">
          <SearchBox
            placeholder="Search sellers by name or phone..."
            items={data.map((item) => item.sellerName)}
            onSearch={(term) => {
              const lowerCaseTerm = term.toLowerCase();
              const filtered = data.filter(
                (item) =>
                  item.sellerName.toLowerCase().includes(lowerCaseTerm) ||
                  item.phoneNumbers.some((phone) =>
                    phone.value.toLowerCase().includes(lowerCaseTerm)
                  )
              );
              setFilteredData(filtered);
            }}
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
            onPageChange={setCurrentPage}
          />
        </div>

        {isPopupOpen && (
          <PopupBox
            title={popupMode === "view" ? "View Seller Details" : "Edit Seller Details"}
            isOpen={isPopupOpen}
            onClose={handlePopupClose}
          >
            {popupMode === "view" && selectedSeller && (
              <div>
                <h2 className="text-xl font-bold mb-4">Seller Details</h2>
                <p>
                  <strong>Name:</strong> {selectedSeller.sellerName}
                </p>
                <p>
                  <strong>Password:</strong> {selectedSeller.password}
                </p>
                <p>
                  <strong>Email:</strong> {selectedSeller.emails.join(", ")}
                </p>
                <p>
                  <strong>Phone Numbers:</strong>{" "}
                  {selectedSeller.phoneNumbers
                    .map((phone) => phone.value)
                    .join(", ")}
                </p>
                <p>
                  <strong>Commodities:</strong>{" "}
                  {selectedSeller.commodities
                    .map(
                      (commodity) =>
                        `${toTitleCase(commodity.name)} (Brokerage: ₹${
                          commodity.brokerage
                        } per ton)`
                    )
                    .join(", ")}
                </p>
                <p>
                  <strong>Companies:</strong>{" "}
                  {selectedSeller.companies.join(", ")}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {toTitleCase(selectedSeller.selectedStatus)}
                </p>
                <p>
                  <strong>Buyers:</strong>{" "}
                  {selectedSeller.buyers
                    .map((buyer) => toTitleCase(buyer.name))
                    .join(", ")}
                </p>
              </div>
            )}

            {popupMode === "edit" && selectedSeller && (
              <EditSellerDetails
                sellerId={selectedSeller._id} // Pass the seller ID to EditSellerDetails
                onClose={handlePopupClose}
              />
            )}
          </PopupBox>
        )}

        <ToastContainer />
      </div>
    </Suspense>
  );
};

export default ListSellerDetails;