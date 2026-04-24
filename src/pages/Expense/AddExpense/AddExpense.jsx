import { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaMoneyBillWave, FaPlus, FaTrash, FaPaperPlane, FaCheck, FaTimes } from "react-icons/fa";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const AddExpense = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "Admin";

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchRequests();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/expense-categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/expense-requests");
      setRequests(res.data);
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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      toast.error("Please fill required fields");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await api.post("/expense-requests", formData);
      toast.success("Expense request submitted for approval");
      setFormData({ category: "", amount: "", description: "" });
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

  const categoryOptions = categories.map((c) => ({
    value: c._id,
    label: c.name,
  }));

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
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FaPaperPlane className="text-emerald-500 text-sm" /> Submit Expense Request
          </h2>
          <form onSubmit={handleRequestSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataDropdown
              label="Expense Category"
              options={categoryOptions}
              selectedOptions={categoryOptions.find((o) => o.value === formData.category)}
              onChange={(opt) => setFormData({ ...formData, category: opt?.value || "" })}
              required
            />
            <DataInput
              label="Amount (Rs.)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <DataInput
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
            />
            <div className="md:col-span-3 flex justify-end">
              <Buttons
                type="submit"
                label={isSubmittingRequest ? "Submitting..." : "Send for Approval"}
                variant="primary"
                disabled={isSubmittingRequest}
              />
            </div>
          </form>
        </div>

        {/* Request History Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800">
            {isAdmin ? "Recent Expense Requests" : "Your Expense History"}
          </h2>
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
                {requests.map((req) => (
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
                              <FaCheck size={12} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req._id, "rejected")}
                              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                              title="Reject"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="py-12 text-center text-slate-400 text-sm italic">
                      No expense requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AddExpense;
