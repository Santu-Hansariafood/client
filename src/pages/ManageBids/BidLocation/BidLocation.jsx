import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";

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
  const itemsPerPage = 10;

  const API_URL = "https://api.hansariafood.shop/api/bid-locations";

  const fetchBidLocations = async () => {
    try {
      const response = await axios.get(API_URL);
      // console.log("API Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      // console.error("Error fetching bid locations:", error);
      toast.error(`Failed to fetch bid locations: ${error?.message || "Unknown error"}`);
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
        const id = data[isEditing]._id;
        // console.log(`Updating bid location with ID: ${id}`);

        const response = await axios.put(`${API_URL}/${id}`, { name: inputValue });

        if (response.status === 200) {
          toast.success("Bid location updated successfully");
        } else {
          throw new Error("Failed to update bid location");
        }
      } else {
        // console.log(`Creating new bid location: ${inputValue}`);

        const response = await axios.post(API_URL, { name: inputValue });

        if (response.status === 201) {
          toast.success("Bid location added successfully");
        } else {
          throw new Error("Failed to create bid location");
        }
      }

      setInputValue("");
      setIsEditing(null);

      setTimeout(fetchBidLocations, 500);
    } catch (error) {
      // console.error("Error saving bid location:", error);
      toast.error(error.response?.data?.message || "Failed to save bid location");
    }
  };

  const handleDelete = async (index) => {
    const id = data[index]._id;
    console.log(`Attempting to delete bid location with ID: ${id}`);

    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await axios.delete(`${API_URL}/${id}`);

        if (response.status === 200) {
          toast.success("Bid location deleted successfully");
          setTimeout(fetchBidLocations, 500);
        } else {
          throw new Error("Failed to delete bid location");
        }
      } catch (error) {
        // console.error("Error deleting bid location:", error);
        toast.error(error.response?.data?.message || "Failed to delete bid location");
      }
    }
  };

  const handleEdit = (index) => {
    setIsEditing(index);
    setInputValue(data[index].name);
    toast.info("Editing mode enabled");
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    fetchBidLocations();
  }, []);

  const headers = ["SL No", "Data", "Actions"];
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const rows = paginatedData.map((row, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    row.name,
    <Actions
      key={index}
      onView={() => toast.info(`Viewing: ${row.name}`)}
      onEdit={() => handleEdit((currentPage - 1) * itemsPerPage + index)}
      onDelete={() => handleDelete((currentPage - 1) * itemsPerPage + index)}
    />,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2 className="text-xl font-bold mb-4">Bid Location</h2>
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <DataInput
            placeholder="Enter bid location"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Buttons
            type="submit"
            label={isEditing !== null ? "Update" : "Save"}
            variant="primary"
            size="md"
          />
        </form>

        <div className="mt-8">
          <Tables headers={headers} rows={rows} />
          <Pagination
            currentPage={currentPage}
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </Suspense>
  );
};

export default BidLocation;
