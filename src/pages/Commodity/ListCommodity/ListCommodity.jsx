import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const EditCommodityPopup = lazy(() =>
  import("../EditCommodityPopup/EditCommodityPopup")
);

const ListCommodity = () => {
  const [commodities, setCommodities] = useState([]);
  const [filteredCommodities, setFilteredCommodities] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const response = await axios.get(
          "https://phpserver-v77g.onrender.com/api/commodities"
        );
        const sortedCommodities = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCommodities(sortedCommodities);
        setFilteredCommodities(sortedCommodities);
      } catch (error) {
        console.error("Error fetching commodities:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommodities();
  }, []);

  const handleSearch = (searchTerm) => {
    if (searchTerm === "") {
      setFilteredCommodities([...commodities]);
    } else {
      const filteredData = commodities.filter((commodity) =>
        commodity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommodities(
        filteredData.sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(
        `https://phpserver-v77g.onrender.com/api/commodities/${id}`
      );
      setSelectedCommodity(response.data);
      setIsPopupOpen(true);
    } catch (error) {
      console.error("Error fetching commodity details:", error);
    }
  };

  const handleEdit = (id) => {
    setSelectedCommodity({ _id: id });
    setIsEditPopupOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://phpserver-v77g.onrender.com/api/commodities/${id}`
      );
      const updatedCommodities = commodities.filter(
        (commodity) => commodity._id !== id
      );
      setCommodities(updatedCommodities);
      setFilteredCommodities(
        updatedCommodities.sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error("Error deleting commodity:", error);
    }
  };

  const tableRows = filteredCommodities.map((commodity, index) => [
    index + 1,
    commodity.name || "N/A",
    commodity.hsnCode || "N/A",
    Array.isArray(commodity.parameters)
      ? commodity.parameters.map((param) => param.parameter).join(", ")
      : "N/A",
    <Actions
      key={commodity._id}
      onView={() => handleView(commodity._id)}
      onEdit={() => handleEdit(commodity._id)}
      onDelete={() => handleDelete(commodity._id)}
    />,
  ]);

  const tableHeaders = [
    "Serial No.",
    "Commodity Name",
    "HSN Code",
    "Parameters",
    "Actions",
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 border-2 border-gray-200">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Commodity List
          </h2>
          <div className="mb-6 flex justify-between items-center">
            <SearchBox
              placeholder="Search Commodities"
              items={commodities.map((commodity) => commodity.name)}
              onSearch={handleSearch}
            />
          </div>
          {filteredCommodities.length > 0 ? (
            <Tables headers={tableHeaders} rows={tableRows} />
          ) : (
            <p>No commodities found.</p>
          )}
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title="Commodity Details"
          >
            {selectedCommodity && (
              <div>
                <p>
                  <strong>Name:</strong> {selectedCommodity.name || "N/A"}
                </p>
                <p>
                  <strong>HSN Code:</strong>{" "}
                  {selectedCommodity.hsnCode || "N/A"}
                </p>
                <p>
                  <strong>Parameters:</strong>{" "}
                  {selectedCommodity.parameters
                    ? selectedCommodity.parameters
                        .map((param) => param.parameter)
                        .join(", ")
                    : "N/A"}
                </p>
              </div>
            )}
          </PopupBox>
          {isEditPopupOpen && (
            <EditCommodityPopup
              isOpen={isEditPopupOpen}
              onClose={() => setIsEditPopupOpen(false)}
              commodityId={selectedCommodity ? selectedCommodity._id : null}
              onUpdate={() => {
                axios
                  .get("https://phpserver-v77g.onrender.com/api/commodities")
                  .then((response) => {
                    const sortedCommodities = response.data.sort((a, b) =>
                      a.name.localeCompare(b.name)
                    );
                    setCommodities(sortedCommodities);
                    setFilteredCommodities(sortedCommodities);
                  });
              }}
            />
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default ListCommodity;
