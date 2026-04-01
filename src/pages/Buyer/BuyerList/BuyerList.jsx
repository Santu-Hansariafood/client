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
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const fetchBuyersData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/buyers", {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
          },
        });
        const data = response.data?.data || [];
        const total = response.data?.total || 0;
        
        setBuyersData(data);
        setFilteredData(data);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch buyers data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBuyersData();
  }, [currentPage, searchQuery, itemsPerPage]);

  const handleSearchByNames = (query) => {
    setSearchQuery(query || "");
    setCurrentPage(1);
  };

  const handleDelete = async (index) => {
    const buyerToDelete = filteredData[index];
    if (!window.confirm(`Are you sure you want to delete ${buyerToDelete.name}?`)) return;

    try {
      await axios.delete(`/buyers/${buyerToDelete._id}`);
      toast.success("Buyer deleted successfully");
      // Re-fetch current page
      const response = await axios.get(`/buyers?page=${currentPage}&limit=${itemsPerPage}`);
      setBuyersData(response.data?.data || []);
      setFilteredData(response.data?.data || []);
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      toast.error("Failed to delete buyer");
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

  const rows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.map((buyer, index) => {
      const slNo = startIndex + index + 1;
      return [
        slNo,
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
          key={buyer._id || index}
          onView={() => {
            setSelectedBuyer(buyer);
            setIsPopupOpen(true);
          }}
          onEdit={() => {
            setSelectedBuyer(buyer);
            setIsEditPopupOpen(true);
          }}
          onDelete={() => handleDelete(index)}
        />,
      ];
    });
  }, [filteredData, currentPage, itemsPerPage]);

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
                returnQuery
              />
            </div>
            {isLoading ? (
              <Loading />
            ) : (
              <>
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
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(page) => setCurrentPage(page)}
                    onPageSizeChange={(size) => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[10, 20, 50, 100]}
                  />
                </div>
              </>
            )}
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
