import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsers } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const EditBuyerPopup = lazy(() => import("../EditBuyerPopup/EditBuyerPopup"));

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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
        const response = await axios.get("/buyers");
        const sortedData = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setBuyersData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        toast.error("Failed to fetch buyers data", error);
      }
    };
    fetchBuyersData();
  }, []);

  const handleSearchByNames = (filteredNames) => {
    if (!filteredNames || filteredNames.length === 0) {
      setFilteredData(buyersData);
      setCurrentPage(1);
      return;
    }
    if (filteredNames.length === buyersData.length) {
      setFilteredData(buyersData);
      setCurrentPage(1);
      return;
    }
    const nameSet = new Set(filteredNames);
    setFilteredData(buyersData.filter((b) => nameSet.has(b.name)));
    setCurrentPage(1);
  };

  const handleView = (index) => {
    const actualIndex = firstItemIndex + index;
    setSelectedBuyer(filteredData[actualIndex]);
    setIsPopupOpen(true);
  };

  const handleEdit = (index) => {
    const actualIndex = firstItemIndex + index;
    setSelectedBuyer(filteredData[actualIndex]);
    setIsEditPopupOpen(true);
  };

  const handleDelete = async (index) => {
    const actualIndex = firstItemIndex + index;
    const buyerToDelete = filteredData[actualIndex];

    try {
      await axios.delete(
        `/buyers/${buyerToDelete._id}`
      );

      const updatedData = filteredData.filter((_, i) => i !== actualIndex);
      setBuyersData(updatedData);
      setFilteredData(updatedData);
      toast.success("Buyer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete buyer. Please try again.", error);
    }
  };

  const handleUpdate = (updatedBuyer) => {
    const updateData = (list) =>
      list.map((buyer) =>
        buyer._id === updatedBuyer._id ? updatedBuyer : buyer
      );

    setBuyersData(updateData(buyersData));
    setFilteredData(updateData(filteredData));
    setIsEditPopupOpen(false);
    toast.success("Buyer updated successfully");
  };

  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;

  const currentItems = useMemo(() => {
    return filteredData.slice(firstItemIndex, lastItemIndex);
  }, [filteredData, firstItemIndex, lastItemIndex]);

  const rows = useMemo(() => {
    return currentItems.map((buyer, index) => [
      firstItemIndex + index + 1,
      toTitleCase(buyer.name || "N/A"),
      buyer.mobile?.join(", ") || "N/A",
      buyer.email?.join(", ").toLowerCase() || "N/A",
      toTitleCase(buyer.companyName || "N/A"),
      toTitleCase(buyer.group || "N/A"),
      toTitleCase(buyer.commodity?.join(", ") || "N/A"),
      buyer.consignee?.map((c) => (
        <ol key={c.value}>
          <li>{toTitleCase(c.label)}</li>
        </ol>
      )) || "N/A",
      toTitleCase(buyer.status || "N/A"),
      <Actions
        key={index}
        onView={() => handleView(index)}
        onEdit={() => handleEdit(index)}
        onDelete={() => handleDelete(index)}
      />,
    ]);
  }, [currentItems, firstItemIndex]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Buyer List"
        subtitle="Search and manage all buyers"
        icon={FaUsers}
        noContentCard
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-amber-200/80 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="mb-4">
              <SearchBox
                placeholder="Search buyers by name..."
                items={buyersData.map((b) => b.name || "")}
                onSearch={handleSearchByNames}
              />
            </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <Tables
                  headers={[
                    "Sl No",
                    "Name",
                    "Mobile",
                    "Email",
                    "Company",
                    "Group Company",
                    "Commodity",
                    "Consignee",
                    "Status",
                    "Actions",
                  ]}
                  rows={rows}
                />
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </div>
          </div>
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title="Buyer Details"
          >
          {selectedBuyer && (
            <div>
              <p>
                <strong>Name:</strong> {toTitleCase(selectedBuyer.name)}
              </p>
              <p>
                <strong>Mobile:</strong> {selectedBuyer.mobile.join(", ")}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {selectedBuyer.email.join(", ").toLowerCase()}
              </p>
              <p>
                <strong>Company Name:</strong>{" "}
                {toTitleCase(selectedBuyer.companyName)} {/* Single value */}
              </p>
              <p>
                <strong>Group of Company Name:</strong>{" "}
                {toTitleCase(selectedBuyer.group)}
              </p>
              <p>
                <strong>Commodity:</strong>{" "}
                {toTitleCase(selectedBuyer.commodity.join(", "))}
              </p>
              <p>
                <strong>Consignee:</strong>
                <ol>
                  {selectedBuyer.consignee.map((c) => (
                    <li key={c.value}>{toTitleCase(c.label)}</li>
                  ))}
                </ol>
              </p>
              <p>
                <strong>Status:</strong> {toTitleCase(selectedBuyer.status)}
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
      </AdminPageShell>
    </Suspense>
  );
};

export default BuyerList;
