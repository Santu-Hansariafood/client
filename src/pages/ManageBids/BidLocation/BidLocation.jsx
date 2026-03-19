import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaMapMarkerAlt } from "react-icons/fa";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));

const BidLocation = () => {
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  const API_URL = "/bid-locations";

  const fetchBidLocations = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?page=${currentPage}&limit=${itemsPerPage}`
      );
      if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
        setTotal(response.data.total);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      toast.error(
        `Failed to fetch bid locations: ${error?.message || "Unknown error"}`
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      toast.warning("Input cannot be empty");
      return;
    }

    try {
      if (isEditing !== null) {
        const response = await axios.put(`${API_URL}/${isEditing}`, {
          name: inputValue,
        });

        if (response.status === 200) {
          toast.success("Bid location updated successfully");
        } else {
          throw new Error("Failed to update bid location");
        }
      } else {
        const response = await axios.post(API_URL, { name: inputValue });

        if (response.status === 201) {
          toast.success("Bid location added successfully");
        } else {
          throw new Error("Failed to create bid location");
        }
      }

      setInputValue("");
      setIsEditing(null);
      fetchBidLocations();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save bid location"
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await axios.delete(`${API_URL}/${id}`);

        if (response.status === 200) {
          toast.success("Bid location deleted successfully");
          fetchBidLocations();
        } else {
          throw new Error("Failed to delete bid location");
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete bid location"
        );
      }
    }
  };

  const handleEdit = (item) => {
    setIsEditing(item._id);
    setInputValue(item.name);
    toast.info("Editing mode enabled");
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    fetchBidLocations();
  }, [currentPage]);

  const headers = ["Sl No", "Origin", "Actions"];
  const rows = data.map((row, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    row.name,
    <Actions
      key={index}
      onView={() => toast.info(`Viewing: ${row.name}`)}
      onEdit={() => handleEdit(row)}
      onDelete={() => handleDelete(row._id)}
    />,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Bid Location"
        subtitle="Create and manage bid location names used in bids"
        icon={FaMapMarkerAlt}
        noContentCard
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
            >
              <div className="flex-1">
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Location name
                </label>
                <DataInput
                  placeholder="Enter bid location"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <div className="shrink-0">
                <Buttons
                  type="submit"
                  label={isEditing !== null ? "Update" : "Save"}
                  variant="primary"
                  size="md"
                />
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            <Tables headers={headers} rows={rows} />
            <Pagination
              currentPage={currentPage}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default BidLocation;
