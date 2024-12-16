import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const EditGroupPopup = lazy(() => import("../EditGroupPopup/EditGroupPopup"));

const ListGroupOfCompany = () => {
  const [groupsData, setGroupsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/groups");
        setGroupsData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        toast.error("Failed to fetch groups");
        console.error("Error fetching groups:", error);
      }
    };
    fetchGroups();
  }, []);

  const handleSearch = useCallback(
    (filteredItems) => {
      const searchResult = groupsData.filter((group) =>
        filteredItems.some((item) =>
          group.groupName.toLowerCase().includes(item.toLowerCase())
        )
      );
      setFilteredData(searchResult);
      setCurrentPage(1);
    },
    [groupsData]
  );

  const handleView = useCallback((index) => {
    setSelectedGroup(filteredData[index]);
    setIsPopupOpen(true);
  }, [filteredData]);

  const handleEdit = useCallback((index) => {
    setSelectedGroup(filteredData[index]);
    setIsEditPopupOpen(true);
  }, [filteredData]);

  const handleDelete = useCallback(
    async (index) => {
      const groupToDelete = filteredData[index];
      try {
        await axios.delete(`http://localhost:5000/api/groups/${groupToDelete._id}`);
        const updatedData = filteredData.filter((_, i) => i !== index);
        setFilteredData(updatedData);
        setGroupsData((prevData) =>
          prevData.filter((group) => group._id !== groupToDelete._id)
        );
        toast.success("Group deleted successfully");
      } catch (error) {
        toast.error("Failed to delete group");
        console.error("Error deleting group:", error);
      }
    },
    [filteredData]
  );

  const handleUpdate = useCallback(
    (updatedGroup) => {
      const updatedList = groupsData.map((group) =>
        group._id === updatedGroup._id ? updatedGroup : group
      );
      setGroupsData(updatedList);
      setFilteredData(updatedList);
    },
    [groupsData]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedData = useMemo(
    () => filteredData.slice(startIndex, startIndex + itemsPerPage),
    [filteredData, startIndex, itemsPerPage]
  );

  const rows = useMemo(
    () =>
      paginatedData.map((group, index) => [
        startIndex + index + 1,
        group.groupName,
        <Actions
          key={index}
          onView={() => handleView(startIndex + index)}
          onEdit={() => handleEdit(startIndex + index)}
          onDelete={() => handleDelete(startIndex + index)}
        />,
      ]),
    [paginatedData, startIndex, handleView, handleEdit, handleDelete]
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-4">
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
        <h2 className="text-2xl font-semibold mb-4 text-center">
          List of Groups of Companies
        </h2>

        <div className="mb-4">
          <SearchBox
            placeholder="Search groups..."
            items={groupsData.map((group) => group.groupName)}
            onSearch={handleSearch}
            className="p-2 border border-gray-300 rounded-lg w-full md:w-1/3 mx-auto"
          />
        </div>

        <Tables headers={["Sl. No", "Group Name", "Actions"]} rows={rows} />

        <Pagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        {isPopupOpen && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={selectedGroup?.groupName || "Group Details"}
          >
            {selectedGroup && (
              <div>
                <p>
                  <strong>Group Name:</strong> {selectedGroup.groupName}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedGroup.description || "N/A"}
                </p>
              </div>
            )}
          </PopupBox>
        )}

        <EditGroupPopup
          isOpen={isEditPopupOpen}
          group={selectedGroup}
          onClose={() => setIsEditPopupOpen(false)}
          onUpdate={handleUpdate}
        />
      </div>
    </Suspense>
  );
};

export default ListGroupOfCompany;
