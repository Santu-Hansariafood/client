import { useState, useEffect } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import SearchBox from "../../../common/SearchBox/SearchBox";
import PopupBox from "../../../common/PopupBox/PopupBox";
import EditCommodityPopup from "../EditCommodityPopup/EditCommodityPopup";

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
          "http://localhost:5000/api/commodities"
        );
        const sortedCommodities = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCommodities(sortedCommodities);
        setFilteredCommodities(sortedCommodities);
      } catch (error) {
        console.error("Error fetching commodities:", error);
        setCommodities([]);
        setFilteredCommodities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommodities();
  }, []);

  const handleSearch = (searchTerm) => {
    if (searchTerm === "") {
      setFilteredCommodities(commodities);
    } else {
      const filteredData = commodities.filter((commodity) =>
        commodity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommodities(filteredData);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/commodities/${id}`
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

  const handleDelete = (id) => {
    console.log("Deleting commodity with ID:", id);
  };

  const tableRows = filteredCommodities.map((commodity, index) => [
    index + 1,
    commodity.name || "N/A",
    commodity.hsnCode || "N/A",
    Array.isArray(commodity.parameters)
      ? commodity.parameters.join(", ")
      : "N/A",
    commodity.activeStatus ? "Active" : "Inactive",
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
    "Active Status",
    "Actions",
  ];

  if (isLoading) {
    return <p>Loading commodities...</p>;
  }

  return (
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
          {selectedCommodity ? (
            <div>
              <p>
                <strong>Name:</strong> {selectedCommodity.name || "N/A"}
              </p>
              <p>
                <strong>HSN Code:</strong> {selectedCommodity.hsnCode || "N/A"}
              </p>
              <p>
                <strong>Parameters:</strong>{" "}
                {Array.isArray(selectedCommodity.parameters)
                  ? selectedCommodity.parameters.join(", ")
                  : "N/A"}
              </p>
              <p>
                <strong>Active Status:</strong>{" "}
                {selectedCommodity.activeStatus ? "Active" : "Inactive"}
              </p>
            </div>
          ) : (
            <p>Loading details...</p>
          )}
        </PopupBox>

        {isEditPopupOpen && (
          <EditCommodityPopup
            isOpen={isEditPopupOpen}
            onClose={() => setIsEditPopupOpen(false)}
            commodityId={selectedCommodity ? selectedCommodity._id : null}
            onUpdate={() => {
              axios
                .get("http://localhost:5000/api/commodities")
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
  );
};

export default ListCommodity;
