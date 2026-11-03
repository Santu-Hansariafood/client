import { useState } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaTrash } from "react-icons/fa";
import Buttons from "../../../../common/Buttons/Buttons";
import DataInput from "../../../../common/DataInput/DataInput";
import api from "../../../../utils/apiClient/apiClient";

const ExpenseCategoryManager = ({ categories, refreshCategories }) => {
  const [newCategory, setNewCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post("/expense-categories", { name: newCategory.trim() });
      toast.success("Category added successfully");
      setNewCategory("");
      refreshCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/expense-categories/${id}`);
      toast.success("Category deleted");
      refreshCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <section className="space-y-6 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-lux-ink">
        <FaPlus className="text-sm text-lux-emerald" /> Create Expense Category
      </h2>
      <form onSubmit={addCategory} className="flex flex-col gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <DataInput
            placeholder="Enter category name (e.g. Fuel, Stationery)"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          />
        </div>
        <Buttons
          type="submit"
          label={isSubmitting ? "Adding..." : "Add Category"}
          variant="primary"
          disabled={isSubmitting}
        />
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <div
            key={category._id}
            className="group flex items-center justify-between gap-2 rounded-xl border border-[#ece4d2] bg-lux-cream px-4 py-2 transition-all hover:border-lux-gold/40"
          >
            <span className="text-sm font-medium text-lux-ink">{category.name}</span>
            <button
              type="button"
              onClick={() => deleteCategory(category._id)}
              className="text-lux-muted transition-colors group-hover:text-rose-500"
              aria-label={`Delete ${category.name} category`}
            >
              <FaTrash size={12} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExpenseCategoryManager;
