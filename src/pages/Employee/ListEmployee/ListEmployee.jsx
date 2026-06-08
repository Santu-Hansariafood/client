import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsers, FaTrash, FaEdit, FaShieldAlt } from "react-icons/fa";
import Tables from "../../../common/Tables/Tables";
import SearchBox from "../../../common/SearchBox/SearchBox";
import Pagination from "../../../common/Paginations/Paginations";
import EditEmployeePopup from "../EditEmployeePopup/EditEmployeePopup";
import AssignPermissionsPopup from "../AssignPermissionsPopup/AssignPermissionsPopup";
import Loading from "../../../common/Loading/Loading";

const ListEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployeeNames, setAllEmployeeNames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isPermissionPopupOpen, setIsPermissionPopupOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchAllNames = useCallback(async () => {
    try {
      const response = await api.get("/employees", { params: { limit: 0 } });
      const data = response.data?.data || response.data || [];
      setAllEmployeeNames(data.map(emp => emp.name).filter(Boolean));
    } catch (error) {
      console.error("Failed to fetch employee names for suggestions", error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/employees", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
        },
      });
      const { data, total } = response.data;
      setEmployees(data || []);
      setTotalItems(total || 0);
    } catch (error) {
      console.error("Failed to fetch employees", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    fetchAllNames();
  }, [fetchAllNames]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const fetchEmployeeDetails = async (id) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch employee details", error);
      return null;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        toast.success("Employee deleted");
        fetchEmployees();
        fetchAllNames();
      } catch (error) {
        toast.error("Failed to delete employee");
      }
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsEditPopupOpen(true);
  };

  const handleAssignPermissions = async (employee) => {
    const fullDetails = await fetchEmployeeDetails(employee._id);
    setSelectedEmployee(fullDetails || employee);
    setIsPermissionPopupOpen(true);
  };

  const handleUpdate = (updatedEmployee) => {
    setEmployees(prev => prev.map(emp => emp._id === updatedEmployee._id ? updatedEmployee : emp));
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query || "");
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const headers = ["Sl No", "Name", "Emp ID", "Email", "Mobile", "Sex", "Status", "Actions"];
  
  const rows = useMemo(() => {
    const startSlNo = (currentPage - 1) * itemsPerPage;
    return employees.map((emp, index) => [
      startSlNo + index + 1,
      emp.name,
      emp.employeeId,
      emp.email,
      emp.mobile,
      emp.sex || "N/A",
      <span key={emp._id} className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
        {emp.status}
      </span>,
      <div key={`actions-${emp._id}`} className="flex gap-2">
        <button 
          onClick={() => handleAssignPermissions(emp)} 
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Assign Permissions"
        >
          <FaShieldAlt />
        </button>
        <button onClick={() => handleEdit(emp)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
          <FaEdit />
        </button>
        <button onClick={() => handleDelete(emp._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <FaTrash />
        </button>
      </div>
    ]);
  }, [employees, currentPage, itemsPerPage]);

  return (
    <AdminPageShell title="Employee List" icon={FaUsers}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 min-h-[400px]">
        <div className="mb-6">
          <SearchBox
            items={allEmployeeNames}
            onSearch={handleSearch}
            placeholder="Search by name, email or ID..."
            returnQuery
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loading size="lg" />
          </div>
        ) : (
          <>
            <Tables headers={headers} rows={rows} />
            
            {totalItems > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <EditEmployeePopup
        employee={selectedEmployee}
        isOpen={isEditPopupOpen}
        onClose={() => setIsEditPopupOpen(false)}
        onUpdate={handleUpdate}
      />

      <AssignPermissionsPopup
        employee={selectedEmployee}
        isOpen={isPermissionPopupOpen}
        onClose={() => setIsPermissionPopupOpen(false)}
        onUpdate={handleUpdate}
      />
    </AdminPageShell>
  );
};

export default ListEmployee;
