import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const EditConsigneePopup = lazy(() =>
  import("../EditConsigneePopup/EditConsigneePopup")
);

const ITEMS_PER_PAGE = 10;

const ListConsignee = () => {
  const [consigneeData, setConsigneeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchConsignees = async () => {
      try {
        const response = await axios.get(
          "https://api.hansariafood.shop/api/consignees"
        );
        const normalizedData = response.data.map((consignee) => ({
          ...consignee,
          email: consignee.email.toLowerCase(),
          gst: consignee.gst.toUpperCase(),
          pan: consignee.pan.toUpperCase(),
        }));
        const sortedData = normalizedData.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setConsigneeData(sortedData);
        setFilteredData(sortedData);
        setLoading(false);
      } catch (error) {
        toast.error("Error fetching consignees:", error);
        setLoading(false);
      }
    };

    fetchConsignees();
  }, []);

  const handleView = (consignee) => {
    setSelectedConsignee(consignee);
    setIsViewPopupOpen(true);
  };

  const handleEdit = (consignee) => {
    setSelectedConsignee(consignee);
    setIsEditPopupOpen(true);
  };

  const submitEdit = async (updatedData) => {
    try {
      const response = await axios.put(
        `https://api.hansariafood.shop/api/consignees/${selectedConsignee._id}`,
        updatedData
      );
      const updatedConsignees = consigneeData.map((consignee) =>
        consignee._id === selectedConsignee._id ? response.data : consignee
      );
      setConsigneeData(updatedConsignees);
      setIsEditPopupOpen(false);
    } catch (error) {
      toast.error("Error updating consignee:", error);
    }
  };

  const handleDelete = (consignee) => {
    setSelectedConsignee(consignee);
    setIsPopupOpen(true);
  };

  const submitDelete = async () => {
    try {
      await axios.delete(
        `https://api.hansariafood.shop/api/consignees/${selectedConsignee._id}`
      );
      const updatedConsignees = consigneeData.filter(
        (consignee) => consignee._id !== selectedConsignee._id
      );
      setConsigneeData(updatedConsignees);
      setIsPopupOpen(false);
    } catch (error) {
      toast.error("Error deleting consignee:", error);
    }
  };

  const handleSearch = (query) => {
    if (!query) {
      setFilteredData(consigneeData);
      return;
    }

    const searchQuery = query.toLowerCase();
    const results = consigneeData.filter(
      (consignee) =>
        consignee.name.toLowerCase().includes(searchQuery) ||
        consignee.phone.includes(searchQuery) ||
        consignee.email.toLowerCase().includes(searchQuery) ||
        consignee.gst.includes(searchQuery) ||
        consignee.pan.includes(searchQuery)
    );

    setFilteredData(results);
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentConsignees = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const formattedRows = currentConsignees.map((consignee, index) => [
    indexOfFirstItem + index + 1,
    consignee.name,
    consignee.phone,
    consignee.email,
    consignee.gst,
    consignee.pan,
    consignee.state,
    consignee.district,
    consignee.location,
    consignee.pin,
    consignee.contactPerson,
    consignee.mandiLicense,
    consignee.activeStatus ? "Active" : "Inactive",
    <Actions
      key={index}
      onView={() => handleView(consignee)}
      onEdit={() => handleEdit(consignee)}
      onDelete={() => handleDelete(consignee)}
    />,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Consignee List
        </h2>
        <div className="mb-4">
          <SearchBox
            placeholder="Search by Name..."
            items={consigneeData.map((c) => c.name || "")}
            onSearch={(filteredNames) => {
              if (filteredNames.length === 0) {
                setFilteredData(consigneeData);
              } else {
                const results = consigneeData.filter((c) =>
                  filteredNames.includes(c.name)
                );
                setFilteredData(results);
              }
            }}
          />
        </div>
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Tables
                headers={[
                  "Sl No.",
                  "Name",
                  "Phone",
                  "Email",
                  "GST",
                  "PAN",
                  "State",
                  "District",
                  "Location",
                  "Pin",
                  "Contact Person",
                  "Mandi License",
                  "Active Status",
                  "Actions",
                ]}
                rows={formattedRows}
              />
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={consigneeData.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        <EditConsigneePopup
          isOpen={isEditPopupOpen}
          onClose={() => setIsEditPopupOpen(false)}
          initialData={selectedConsignee || {}}
          onSubmit={submitEdit}
        />

        <PopupBox
          isOpen={isViewPopupOpen}
          onClose={() => setIsViewPopupOpen(false)}
          title={`View Consignee: ${selectedConsignee?.name}`}
        >
          {selectedConsignee && (
            <div>
              <p>
                <strong>Name:</strong> {selectedConsignee.name}
              </p>
              <p>
                <strong>Phone:</strong> {selectedConsignee.phone}
              </p>
              <p>
                <strong>Email:</strong> {selectedConsignee.email}
              </p>
              <p>
                <strong>GST:</strong> {selectedConsignee.gst}
              </p>
              <p>
                <strong>PAN:</strong> {selectedConsignee.pan}
              </p>
              <p>
                <strong>State:</strong> {selectedConsignee.state}
              </p>
              <p>
                <strong>District:</strong> {selectedConsignee.district}
              </p>
              <p>
                <strong>Location:</strong> {selectedConsignee.location}
              </p>
              <p>
                <strong>Pin:</strong> {selectedConsignee.pin}
              </p>
              <p>
                <strong>Contact Person:</strong>{" "}
                {selectedConsignee.contactPerson}
              </p>
              <p>
                <strong>Mandi License:</strong> {selectedConsignee.mandiLicense}
              </p>
              <p>
                <strong>Active Status:</strong>{" "}
                {selectedConsignee.activeStatus ? "Active" : "Inactive"}
              </p>
            </div>
          )}
        </PopupBox>

        <PopupBox
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title={`Delete Consignee: ${selectedConsignee?.name}`}
        >
          <p>Are you sure you want to delete this consignee?</p>
          <button
            onClick={submitDelete}
            className="bg-red-500 text-white px-4 py-2 rounded mt-4"
          >
            Confirm Delete
          </button>
        </PopupBox>
      </div>
    </Suspense>
  );
};

export default ListConsignee;
