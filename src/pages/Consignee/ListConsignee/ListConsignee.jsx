import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTruck } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const EditConsigneePopup = lazy(
  () => import("../EditConsigneePopup/EditConsigneePopup"),
);

const ITEMS_PER_PAGE = 10;

const ListConsignee = () => {
  const [consigneeData, setConsigneeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState("");

  const [selectedConsignee, setSelectedConsignee] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);

  const fetchConsignees = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/consignees", {
        params: {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: searchText,
        },
      });

      const data = response?.data?.data || [];
      const total = response?.data?.total || 0;

      const normalized = data.map((c) => ({
        ...c,
        email: c.email?.toLowerCase() || "",
        gst: c.gst?.toUpperCase() || "",
        pan: c.pan?.toUpperCase() || "",
      }));

      setConsigneeData(normalized);
      setTotalItems(total);
    } catch (error) {
      console.error("Fetch Consignee Error:", error);

      toast.error(
        error?.response?.data?.message || "Error fetching consignees",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignees();
  }, [currentPage, searchText]);

  const handleView = (consignee) => {
    setSelectedConsignee(consignee);
    setIsViewPopupOpen(true);
  };

  const handleEdit = (consignee) => {
    setSelectedConsignee(consignee);
    setIsEditPopupOpen(true);
  };

  const handleDelete = (consignee) => {
    setSelectedConsignee(consignee);
    setIsPopupOpen(true);
  };

  const submitEdit = async (updatedData) => {
    try {
      await axios.put(`/consignees/${selectedConsignee._id}`, updatedData);

      toast.success("Consignee updated successfully");

      setIsEditPopupOpen(false);

      fetchConsignees();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error updating consignee");
    }
  };

  const submitDelete = async () => {
    try {
      await axios.delete(`/consignees/${selectedConsignee._id}`);

      toast.success("Consignee deleted successfully");

      setIsPopupOpen(false);

      fetchConsignees();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error deleting consignee");
    }
  };

  const formattedRows = consigneeData.map((consignee, index) => [
    (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
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
      key={consignee._id}
      onView={() => handleView(consignee)}
      onEdit={() => handleEdit(consignee)}
      onDelete={() => handleDelete(consignee)}
    />,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Consignee List"
        subtitle="View and manage all consignees"
        icon={FaTruck}
        noContentCard
      >
        <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6 w-full overflow-hidden">
          <div className="mb-4">
            <SearchBox
              placeholder="Search by name / phone / gst..."
              items={consigneeData.map((c) => c.name)}
              onSearch={(value) => {
                setSearchText(value || "");
                setCurrentPage(1);
              }}
            />
          </div>

          {loading ? (
            <Loading />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-100 -mx-1 px-1">
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

              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          )}
        </div>
        <PopupBox
          isOpen={isViewPopupOpen}
          onClose={() => setIsViewPopupOpen(false)}
          title={`View Consignee: ${selectedConsignee?.name}`}
        >
          {selectedConsignee && (
            <div className="space-y-2 text-sm">
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

        <EditConsigneePopup
          isOpen={isEditPopupOpen}
          onClose={() => setIsEditPopupOpen(false)}
          initialData={selectedConsignee || {}}
          onSubmit={submitEdit}
        />
        <PopupBox
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title={`Delete Consignee: ${selectedConsignee?.name}`}
        >
          <p>Are you sure you want to delete this consignee?</p>

          <button
            type="button"
            onClick={submitDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600"
          >
            Confirm Delete
          </button>
        </PopupBox>
      </AdminPageShell>
    </Suspense>
  );
};

export default ListConsignee;
