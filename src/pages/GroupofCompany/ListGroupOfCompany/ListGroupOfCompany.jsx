import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaBuilding } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const EditGroupPopup = lazy(() => import("../EditGroupPopup/EditGroupPopup"));

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ListGroupOfCompany = () => {
  const [groupsData, setGroupsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get("/groups", {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
          },
        });
        const data = response.data?.data || response.data || [];
        const normalized = data
          .map((group) => ({
            ...group,
            groupName: toTitleCase(group.groupName || ""),
          }))
          .sort((a, b) => a.groupName.localeCompare(b.groupName));
        const total =
          typeof response.data?.total === "number"
            ? response.data.total
            : normalized.length;
        setGroupsData(normalized);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch groups", error);
      }
    };
    fetchGroups();
  }, [currentPage, searchQuery]);

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query || "");
      setCurrentPage(1);
    },
    [],
  );

  const handleView = useCallback(
    (group) => {
      setSelectedGroup(group);
      setIsPopupOpen(true);
    },
    [],
  );

  const handleEdit = useCallback(
    (group) => {
      setSelectedGroup(group);
      setIsEditPopupOpen(true);
    },
    [],
  );

  const handleDelete = useCallback(
    async (groupToDelete) => {
      try {
        await axios.delete(`/groups/${groupToDelete._id}`);
        setGroupsData((prevData) =>
          prevData.filter((group) => group._id !== groupToDelete._id),
        );
        setTotalItems((prev) => Math.max(0, prev - 1));
        toast.success("Group deleted successfully");
      } catch (error) {
        toast.error("Failed to delete group", error);
      }
    },
    [],
  );

  const handleUpdate = useCallback(
    (updatedGroup) => {
      const formattedGroup = {
        ...updatedGroup,
        groupName: toTitleCase(updatedGroup.groupName),
      };
      const updatedList = groupsData
        .map((group) =>
          group._id === formattedGroup._id ? formattedGroup : group
        )
        .sort((a, b) => a.groupName.localeCompare(b.groupName));
      setGroupsData(updatedList);
      setFilteredData(updatedList);
      setIsEditPopupOpen(false);
      toast.success("Group updated successfully");
    },
    [groupsData]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const rows = useMemo(
    () =>
      groupsData.map((group, index) => [
        startIndex + index + 1,
        group.groupName,
        <Actions
          key={group._id}
          onView={() => handleView(group)}
          onEdit={() => handleEdit(group)}
          onDelete={() => handleDelete(group)}
        />,
      ]),
    [groupsData, startIndex, handleView, handleEdit, handleDelete],
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Group of Company"
        subtitle="List and manage groups of companies"
        icon={FaBuilding}
        noContentCard
      >
        <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6 w-full overflow-hidden">
          <div className="mb-4 max-w-md">
            <SearchBox
              placeholder="Search groups..."
              items={groupsData.map((group) => group.groupName)}
              onSearch={handleSearch}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Tables headers={["Sl No", "Group Name", "Actions"]} rows={rows} />
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {isPopupOpen && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={selectedGroup?.groupName || "Group Details"}
          >
            {selectedGroup && (
              <div className="space-y-2 text-sm">
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
      </AdminPageShell>
    </Suspense>
  );
};

export default ListGroupOfCompany;
