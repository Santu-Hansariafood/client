import { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaMoneyBillWave, FaPlus, FaTrash, FaPaperPlane, FaCheck, FaTimes, FaFileExcel, FaFilePdf, FaFilter } from "react-icons/fa";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Paginations from "../../../common/Paginations/Paginations";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const AddExpense = () => {
  const { userRole, user } = useAuth();
  const isAdmin = userRole === "Admin";

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [expenseItems, setExpenseItems] = useState([
    { category: "", amount: "", description: "" }
  ]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Filters for Admin
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    status: ""
  });

  useEffect(() => {
    fetchCategories();
    fetchRequests();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [page, filters]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/expense-categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/expense-requests/employees");
      setEmployees(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch employees");
    }
  };

  const fetchRequests = async () => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      const res = await api.get(`/expense-requests?${queryParams}`);
      setRequests(res.data.requests);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error("Failed to fetch expense requests");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setIsSubmittingCategory(true);
    try {
      await api.post("/expense-categories", { name: newCategory.trim() });
      toast.success("Category added successfully");
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/expense-categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { category: "", amount: "", description: "" }]);
  };

  const removeExpenseItem = (index) => {
    if (expenseItems.length > 1) {
      const newItems = expenseItems.filter((_, i) => i !== index);
      setExpenseItems(newItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...expenseItems];
    newItems[index][field] = value;
    setExpenseItems(newItems);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const isValid = expenseItems.every(item => item.category && item.amount);
    if (!isValid) {
      toast.error("Please fill required fields for all items");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await api.post("/expense-requests", { items: expenseItems });
      toast.success("Expense request(s) submitted for approval");
      setExpenseItems([{ category: "", amount: "", description: "" }]);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/expense-requests/${id}/status`, { status });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const downloadExcel = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 10000 // Large limit to get all filtered requests
      }).toString();
      const res = await api.get(`/expense-requests?${queryParams}`);
      const allRequests = res.data.requests;

      const data = allRequests.map(req => ({
        Date: new Date(req.createdAt).toLocaleDateString(),
        Employee: req.employee?.name || "N/A",
        Category: req.category?.name || "N/A",
        Amount: req.amount,
        Description: req.description || "",
        Status: req.status
      }));
      generateExcel(data, `Expenses_${new Date().toLocaleDateString()}.xlsx`);
    } catch (error) {
      toast.error("Failed to export Excel");
    }
  };

  const generatePDF = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 10000
      }).toString();
      const res = await api.get(`/expense-requests?${queryParams}`);
      const allRequests = res.data.requests;

      const doc = new jsPDF();
      doc.text("Expense Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      if (isAdmin && filters.employeeId) {
        const empName = employees.find(e => e._id === filters.employeeId)?.name;
        if (empName) doc.text(`Employee: ${empName}`, 14, 28);
      }

      const tableColumn = ["Date", "Category", "Amount", "Description", "Status"];
      const tableRows = allRequests.map(req => [
        new Date(req.createdAt).toLocaleDateString(),
        req.category?.name || "N/A",
        `Rs. ${req.amount}`,
        req.description || "-",
        req.status
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: isAdmin && filters.employeeId ? 35 : 30,
      });

      const totalAmount = allRequests.reduce((sum, req) => sum + req.amount, 0);
      doc.text(`Total Amount: Rs. ${totalAmount}`, 14, doc.lastAutoTable.finalY + 10);

      doc.save(`Expense_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  const employeeOptions = [
    { value: "", label: "All Employees" },
    ...employees.map(emp => ({ value: emp._id, label: emp.name }))
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <AdminPageShell title="Expense Management" icon={FaMoneyBillWave}>
      <div className="space-y-8">
        {/* Admin Section: Category Management */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaPlus className="text-emerald-500 text-sm" /> Create Expense Category
            </h2>
            <form onSubmit={handleAddCategory} className="flex gap-4">
              <div className="flex-1">
                <DataInput
                  placeholder="Enter category name (e.g. Fuel, Stationery)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <Buttons
                type="submit"
                label={isSubmittingCategory ? "Adding..." : "Add Category"}
                variant="primary"
                disabled={isSubmittingCategory}
              />
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="group flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-all"
                >
                  <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Submission Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaPaperPlane className="text-emerald-500 text-sm" /> Submit Expense Request
            </h2>
            <button
              onClick={addExpenseItem}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all font-bold text-sm"
            >
              <FaPlus size={12} /> Add More
            </button>
          </div>
          
          <form onSubmit={handleRequestSubmit} className="space-y-6">
            {expenseItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end p-4 bg-slate-50/50 rounded-xl border border-slate-100 relative">
                {expenseItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpenseItem(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors border border-rose-100 shadow-sm"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
                <div className="md:col-span-4">
                  <DataDropdown
                    label="Expense Category"
                    options={categoryOptions}
                    selectedOptions={categoryOptions.find((o) => o.value === item.category)}
                    onChange={(opt) => handleItemChange(index, "category", opt?.value || "")}
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <DataInput
                    label="Amount (Rs.)"
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-5">
                  <DataInput
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    placeholder="Optional details..."
                  />
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-2">
              <Buttons
                type="submit"
                label={isSubmittingRequest ? "Submitting..." : "Send for Approval"}
                variant="primary"
                disabled={isSubmittingRequest}
              />
            </div>
          </form>
        </div>

        {/* Filters and List Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800">
              {isAdmin ? "Recent Expense Requests" : "Your Expense History"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm"
                title="Download Excel"
              >
                <FaFileExcel /> Excel
              </button>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all font-bold text-sm"
                title="Generate PDF"
              >
                <FaFilePdf /> PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            {isAdmin && (
              <DataDropdown
                label="Employee"
                options={employeeOptions}
                selectedOptions={employeeOptions.find(o => o.value === filters.employeeId)}
                onChange={(opt) => setFilters({ ...filters, employeeId: opt?.value || "" })}
              />
            )}
            <DataInput
              label="From Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <DataInput
              label="To Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            <DataDropdown
              label="Status"
              options={statusOptions}
              selectedOptions={statusOptions.find(o => o.value === filters.status)}
              onChange={(opt) => setFilters({ ...filters, status: opt?.value || "" })}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-bold text-slate-500 text-xs uppercase">Date</th>
                  {isAdmin && <th className="pb-4 font-bold text-slate-500 text-xs uppercase">Employee</th>}
                  <th className="pb-4 font-bold text-slate-500 text-xs uppercase">Category</th>
                  <th className="pb-4 font-bold text-slate-500 text-xs uppercase">Amount</th>
                  <th className="pb-4 font-bold text-slate-500 text-xs uppercase">Description</th>
                  <th className="pb-4 font-bold text-slate-500 text-xs uppercase text-center">Status</th>
                  {isAdmin && <th className="pb-4 font-bold text-slate-500 text-xs uppercase text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-sm text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{req.employee?.name}</span>
                            <span className="text-[10px] text-slate-400">{req.employee?.email}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 text-sm font-medium text-slate-700">{req.category?.name}</td>
                      <td className="py-4 text-sm font-bold text-emerald-600">Rs. {req.amount}</td>
                      <td className="py-4 text-sm text-slate-500">{req.description || "-"}</td>
                      <td className="py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            req.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : req.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          {req.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleStatusUpdate(req._id, "approved")}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                title="Approve"
                              >
                                <FaCheck size={14} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(req._id, "rejected")}
                                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                title="Reject"
                              >
                                <FaTimes size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="py-10 text-center text-slate-400 italic">
                      No expense requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center pt-4">
            <Paginations
              currentPage={page}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AddExpense;
