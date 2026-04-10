import { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsers, FaTrash, FaEdit } from "react-icons/fa";
import Tables from "../../../common/Tables/Tables";
import SearchBox from "../../../common/SearchBox/SearchBox";
import Pagination from "../../../common/Paginations/Paginations";
import EditEmployeePopup from "../EditEmployeePopup/EditEmployeePopup";

const ListEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchQuery]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
        },
      });
      const { data, total } = response.data;
      setEmployees(data);
      setFilteredEmployees(data);
      setTotalItems(total);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch employees", error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        toast.success("Employee deleted");
        fetchEmployees();
      } catch (error) {
        toast.error("Failed to delete employee", error);
      }
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsEditPopupOpen(true);
  };

  const handleUpdate = (updatedEmployee) => {
    setEmployees(prev => prev.map(emp => emp._id === updatedEmployee._id ? updatedEmployee : emp));
    setFilteredEmployees(prev => prev.map(emp => emp._id === updatedEmployee._id ? updatedEmployee : emp));
  };

  const handleSearch = (query) => {
    setSearchQuery(query || "");
    setCurrentPage(1);
  };

  const headers = ["Sl No", "Name", "Emp ID", "Email", "Mobile", "Sex", "Status", "Actions"];
  const rows = filteredEmployees.map((emp, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    emp.name,
    emp.employeeId,
    emp.email,
    emp.mobile,
    emp.sex || "N/A",
    <span key={emp._id} className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {emp.status}
    </span>,
    <div key={`actions-${emp._id}`} className="flex gap-2">
      <button onClick={() => handleEdit(emp)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
        <FaEdit />
      </button>
      <button onClick={() => handleDelete(emp._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
        <FaTrash />
      </button>
    </div>
  ]);

  return (
    <AdminPageShell title="Employee List" icon={FaUsers}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="mb-6">
          <SearchBox
            items={employees.map((emp) => emp.name)}
            onSearch={handleSearch}
            placeholder="Search by name..."
            returnQuery
          />
        </div>
        <Tables headers={headers} rows={rows} />
        
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <EditEmployeePopup
        employee={selectedEmployee}
        isOpen={isEditPopupOpen}
        onClose={() => setIsEditPopupOpen(false)}
        onUpdate={handleUpdate}
      />
    </AdminPageShell>
  );
};

export default ListEmployee;
