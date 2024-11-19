import { useState, useEffect } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";
import PopupBox from "../../../common/PopupBox/PopupBox";
import SearchBox from "../../../common/SearchBox/SearchBox";
import EditPopupBox from "../../../common/EditPopupBox/EditPopupBox";

const ListConsignee = () => {
  const [consigneeData, setConsigneeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedConsignee, setSelectedConsignee] = useState(null);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchConsignees = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/consignees"
        );
        setConsigneeData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching consignees:", error);
        setLoading(false);
      }
    };

    fetchConsignees();
  }, []);

  // Handle Edit Action
  const handleEdit = (consignee) => {
    setSelectedConsignee(consignee);
    setIsEditPopupOpen(true);
  };

  const submitEdit = async (updatedData) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/consignees/${selectedConsignee._id}`,
        updatedData
      );
      const updatedConsignees = consigneeData.map((consignee) =>
        consignee._id === selectedConsignee._id ? response.data : consignee
      );
      setConsigneeData(updatedConsignees);
      setIsEditPopupOpen(false);
    } catch (error) {
      console.error("Error updating consignee:", error);
    }
  };

  // Handle Delete Action
  const handleDelete = (consignee) => {
    setSelectedConsignee(consignee);
    setIsPopupOpen(true);
  };

  const submitDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/consignees/${selectedConsignee._id}`
      );
      const updatedConsignees = consigneeData.filter(
        (consignee) => consignee._id !== selectedConsignee._id
      );
      setConsigneeData(updatedConsignees);
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Error deleting consignee:", error);
    }
  };

  const formattedRows = consigneeData.map((consignee, index) => [
    index + 1,
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
      onView={() => console.log(`View ${consignee.name}`)}
      onEdit={() => handleEdit(consignee)}
      onDelete={() => handleDelete(consignee)}
    />,
  ]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Consignee List</h2>
      {/* Optional search feature */}
      <div className="mb-4">
        <SearchBox
          placeholder="Search Consignee..."
          items={consigneeData.map((consignee) => consignee.name)}
          onSearch={(filteredItems) => {
            console.log('Search results:', filteredItems);
          }}
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
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
      )}

      {/* Edit Popup */}
      <EditPopupBox
        isOpen={isEditPopupOpen}
        onClose={() => setIsEditPopupOpen(false)}
        initialData={selectedConsignee || {}}
        onSubmit={submitEdit}
      />

      {/* Delete Confirmation Popup */}
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
  );
};

export default ListConsignee;
