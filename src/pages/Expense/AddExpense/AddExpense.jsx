import { useRef, useState } from "react";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaMoneyBillWave } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import ExpenseCategoryManager from "./components/ExpenseCategoryManager";
import ExpenseEntryForm from "./components/ExpenseEntryForm";
import ExpenseRequestsPanel from "./components/ExpenseRequestsPanel";
import useExpenseData from "./hooks/useExpenseData";
import useExpenseDocuments from "./hooks/useExpenseDocuments";
import {
  formatFinancialYear,
  getCurrentFinancialYear,
} from "./utils/financialYear";

const createEmptyExpense = () => ({
  seller: "",
  sellerCompany: "",
  receivedFrom: "",
  description: "",
  rejectedLorryNo: "",
  loading: "",
  unloading: "",
  balance: "",
  netWeight: "",
  newLorryNo: "",
  newWeight: "",
  challanWeight: "",
  employeeId: "",
  createdByName: "",
  items: [{ category: "", description: "", quantity: "1", amount: "" }],
});

const AddExpense = () => {
  const { userRole, user } = useAuth();
  const isAdmin = userRole === "Admin";
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    status: "",
    financialYear: String(getCurrentFinancialYear()),
  });
  const [expenseItems, setExpenseItems] = useState([createEmptyExpense()]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const expenseFormRef = useRef(null);
  const limit = 10;

  const {
    categories,
    employees,
    fetchCategories,
    fetchRequests,
    financialYears,
    handleStatusUpdate,
    requests,
    sellers,
    total,
    trackedAmount,
  } = useExpenseData({ isAdmin, page, limit, filters });
  const {
    downloadExpenseVoucher,
    exportExcel,
    exportPdf,
    shareExpenseVoucher,
  } = useExpenseDocuments({ isAdmin, filters, employees });

  const addExpenseItem = () => {
    setExpenseItems((current) => [...current, createEmptyExpense()]);
  };

  const removeExpenseItem = (index) => {
    setExpenseItems((current) =>
      current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current,
    );
  };

  const handleExpenseChange = (expenseIndex, field, value) => {
    setExpenseItems((current) =>
      current.map((expense, index) =>
        index === expenseIndex ? { ...expense, [field]: value } : expense,
      ),
    );
  };

  const handleLineItemChange = (expenseIndex, itemIndex, field, value) => {
    setExpenseItems((current) =>
      current.map((expense, index) =>
        index === expenseIndex
          ? {
              ...expense,
              items: expense.items.map((item, lineIndex) =>
                lineIndex === itemIndex ? { ...item, [field]: value } : item,
              ),
            }
          : expense,
      ),
    );
  };

  const addLineItem = (expenseIndex) => {
    setExpenseItems((current) =>
      current.map((expense, index) =>
        index === expenseIndex
          ? {
              ...expense,
              items: [
                ...expense.items,
                { category: "", description: "", quantity: "1", amount: "" },
              ],
            }
          : expense,
      ),
    );
  };

  const removeLineItem = (expenseIndex, itemIndex) => {
    setExpenseItems((current) =>
      current.map((expense, index) =>
        index === expenseIndex && expense.items.length > 1
          ? {
              ...expense,
              items: expense.items.filter((_, lineIndex) => lineIndex !== itemIndex),
            }
          : expense,
      ),
    );
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    const isValid = expenseItems.every(
      (expense) =>
        expense.seller &&
        expense.sellerCompany &&
        expense.receivedFrom &&
        (!isAdmin || expense.employeeId) &&
        expense.items.length > 0 &&
        expense.items.every(
          (item) =>
            item.category &&
            Number.isFinite(Number(item.quantity ?? 1)) &&
            Number(item.quantity ?? 1) > 0 &&
            Number.isFinite(Number(item.amount)) &&
            Number(item.amount) > 0,
        ),
    );
    if (!isValid) {
      toast.error(
        isAdmin
          ? "Select an employee and complete all expense fields"
          : "Complete seller details and all expense item fields",
      );
      return;
    }

    setIsSubmittingRequest(true);
    try {
      if (editingExpenseId) {
        await api.put(`/expense-requests/${editingExpenseId}`, {
          expense: expenseItems[0],
        });
        toast.success("Expense updated successfully");
        setEditingExpenseId("");
      } else {
        const response = await api.post("/expense-requests", {
          expenses: expenseItems,
        });
        const vouchers = (response.data || [])
          .map((expense) => expense.voucherNumber)
          .filter(Boolean)
          .join(", ");
        toast.success(
          vouchers
            ? `Expense(s) submitted. Voucher No.: ${vouchers}`
            : "Expense(s) submitted successfully",
        );
      }
      setExpenseItems([createEmptyExpense()]);
      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleEditExpense = (request) => {
    const requestSellerId =
      typeof request.seller === "object" ? request.seller?._id : request.seller;
    const items =
      request.lineItems?.length > 0
        ? request.lineItems.map((item) => ({
            category:
              typeof item.category === "object"
                ? item.category?._id
                : item.category || "",
            description: item.description || "",
            quantity: String(item.quantity ?? 1),
            amount: String(item.amount ?? ""),
          }))
        : [
            {
              category:
                typeof request.category === "object"
                  ? request.category?._id
                  : request.category || "",
              description: "",
              quantity: "1",
              amount: String(request.amount ?? ""),
            },
          ];

    setExpenseItems([
      {
        seller: requestSellerId || "",
        sellerCompany: request.sellerCompany || "",
        receivedFrom: request.receivedFrom || "",
        description: request.description || "",
        rejectedLorryNo: request.transportDetails?.rejectedLorryNo || "",
        loading: request.transportDetails?.loading || "",
        unloading: request.transportDetails?.unloading || "",
        balance: request.transportDetails?.balance || "",
        netWeight: request.transportDetails?.netWeight || "",
        newLorryNo: request.transportDetails?.newLorryNo || "",
        newWeight: request.transportDetails?.newWeight || "",
        challanWeight: request.transportDetails?.challanWeight || "",
        createdByName: request.createdBy?.name || request.employee?.name || "",
        employeeId:
          request.employee?._id ||
          (typeof request.employee === "string" ? request.employee : ""),
        items,
      },
    ]);
    setEditingExpenseId(request._id);
    requestAnimationFrame(() =>
      expenseFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  const cancelEdit = () => {
    setEditingExpenseId("");
    setExpenseItems([createEmptyExpense()]);
  };

  return (
    <AdminPageShell title="Expense Management" icon={FaMoneyBillWave}>
      <div className="space-y-8">
        {isAdmin && (
          <ExpenseCategoryManager
            categories={categories}
            refreshCategories={fetchCategories}
          />
        )}
        <ExpenseEntryForm
          isAdmin={isAdmin}
          user={user}
          categories={categories}
          sellers={sellers}
          employees={employees}
          requests={requests}
          expenseItems={expenseItems}
          isSubmittingRequest={isSubmittingRequest}
          editingExpenseId={editingExpenseId}
          expenseFormRef={expenseFormRef}
          onSubmit={handleRequestSubmit}
          onCancelEdit={cancelEdit}
          onAddExpense={addExpenseItem}
          onRemoveExpense={removeExpenseItem}
          onExpenseChange={handleExpenseChange}
          onLineItemChange={handleLineItemChange}
          onAddLineItem={addLineItem}
          onRemoveLineItem={removeLineItem}
        />
        <ExpenseRequestsPanel
          isAdmin={isAdmin}
          employees={employees}
          financialYears={(Array.isArray(financialYears) ? financialYears : []).map((year) => ({
            value: String(year),
            label: formatFinancialYear(year),
          }))}
          filters={filters}
          setFilters={setFilters}
          requests={requests}
          total={total}
          trackedAmount={trackedAmount}
          page={page}
          limit={limit}
          setPage={setPage}
          onExportExcel={exportExcel}
          onExportPdf={exportPdf}
          onEdit={handleEditExpense}
          onDownloadVoucher={downloadExpenseVoucher}
          onShareVoucher={shareExpenseVoucher}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </AdminPageShell>
  );
};

export default AddExpense;
