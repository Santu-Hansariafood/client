import { lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsersCog } from "react-icons/fa";

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

  const apiBaseURL = "";

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get(`${apiBaseURL}/sellers`);
        const formattedData = response.data.map((seller) => ({
          ...seller,
          sellerName: toTitleCase(seller.sellerName),
          companies: seller.companies.map((company) => toTitleCase(company)),
          emails: seller.emails.map((email) => email.value.toLowerCase()),
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
    "Sl No",
    "Seller Name",
    "Emails",
    "Phone Numbers",
    "Commodity",
    "Company",
    "Status",
    "Actions",
  ];

  const handleDeleteSeller = async (sellerId) => {
    try {
      await axios.delete(`${apiBaseURL}/sellers/${sellerId}`);
      const updatedData = data.filter((seller) => seller._id !== sellerId);
      setData(updatedData);
      setFilteredData(updatedData);
      toast.success("Seller deleted successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete seller"
      );
    }
  };

  const rows = filteredData
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((item, index) => [
      (currentPage - 1) * itemsPerPage + index + 1,
      item.sellerName,
      item.emails
        .map((email) => (
          <a
            key={email}
            href={`mailto:${email}`}
            className="text-blue-600 underline hover:text-blue-800 transition-colors duration-150"
          >
            {email}
          </a>
        ))
        .reduce((prev, curr) => [prev, ", ", curr]),
      item.phoneNumbers
        .map((phone) => (
          <a
            key={phone.value}
            href={`tel:${phone.value}`}
            className="text-blue-600 underline hover:text-blue-800 transition-colors duration-150"
          >
            {phone.value}
          </a>
        ))
        .reduce((prev, curr) => [prev, ", ", curr]),
      item.commodities
        .map(
          (commodity) =>
            <span key={commodity.name}>
              {`${toTitleCase(commodity.name)} (Brokerage: ₹${commodity.brokerage} per ton)`}<br />
            </span>
        ),
      item.companies.join(", "),
      toTitleCase(item.status),
      <Actions
        key={item._id}
        onView={() => {
          setSelectedSeller(item);
          setPopupMode("view");
          setIsPopupOpen(true);
        }}
        onEdit={() => handleEditSeller(item)}
        onDelete={() => handleDeleteSeller(item._id)}
      />,
    ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Seller Details"
        subtitle="Search, view, edit, and manage seller users"
        icon={FaUsersCog}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <SearchBox
              placeholder="Search sellers by name..."
              items={data.map((item) => item.sellerName)}
              onSearch={(filteredNames) => {
                if (!filteredNames.length) {
                  setFilteredData(data);
                  return;
                }

                const filteredSellers = data.filter((seller) =>
                  filteredNames.includes(seller.sellerName)
                );

                setFilteredData(filteredSellers);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            <Tables headers={headers} rows={rows} />
            <Pagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>

        {isPopupOpen && (
          <PopupBox
            title={
              popupMode === "view"
                ? "View Seller Details"
                : "Edit Seller Details"
            }
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
                  <strong>Email:</strong>{" "}
                  {selectedSeller.emails.map((email, idx) => (
                    <span key={email}>
                      <a
                        href={`mailto:${email}`}
                        className="text-blue-600 underline hover:text-blue-800 transition-colors duration-150"
                      >
                        {email}
                      </a>
                      {idx < selectedSeller.emails.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
                <p>
                  <strong>Phone Numbers:</strong>{" "}
                  {selectedSeller.phoneNumbers.map((phone, idx) => (
                    <span key={phone.value}>
                      <a
                        href={`tel:${phone.value}`}
                        className="text-blue-600 underline hover:text-blue-800 transition-colors duration-150"
                      >
                        {phone.value}
                      </a>
                      {idx < selectedSeller.phoneNumbers.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
                <p>
                  <strong>Commodities:</strong>{" "}
                  {selectedSeller.commodities.map((commodity, idx) => (
                    <span key={commodity.name}>
                      {`${toTitleCase(commodity.name)} (Brokerage: ₹${commodity.brokerage} per ton)`}<br />
                    </span>
                  ))}
                </p>
                <p>
                  <strong>Companies:</strong>{" "}
                  {selectedSeller.companies.join(", ")}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {toTitleCase(selectedSeller.status)}
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
                sellerId={selectedSeller._id}
                onClose={handlePopupClose}
                onSave={(updatedSeller) => {
                  const updatedData = data.map((seller) =>
                    seller._id === updatedSeller._id ? updatedSeller : seller
                  );
                  setData(updatedData);
                  setFilteredData(updatedData);
                  setSelectedSeller(updatedSeller);
                }}
              />
            )}
          </PopupBox>
        )}

        <ToastContainer />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ListSellerDetails;
