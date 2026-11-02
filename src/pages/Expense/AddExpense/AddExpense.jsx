import { useState, useEffect, useRef } from "react";
import api from "../../../utils/apiClient/apiClient";

import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaMoneyBillWave, FaPlus, FaTrash, FaPaperPlane, FaCheck, FaTimes, FaFileExcel, FaFilePdf, FaWhatsapp, FaEdit } from "react-icons/fa";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Paginations from "../../../common/Paginations/Paginations";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";
import { downloadFile } from "../../../utils/fileDownloader";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const createEmptyExpense = () => ({
  seller: "",
  sellerCompany: "",
  receivedFrom: "",
  description: "",
  employeeId: "",
  createdByName: "",
  items: [{ category: "", description: "", amount: "" }],
});

const calculateTotalAmount = (items) =>
  items.reduce(
    (totalCents, item) =>
      totalCents + Math.round((Number(item.amount) || 0) * 100),
    0,
  ) / 100;

const AddExpense = () => {
  const { userRole, user } = useAuth();
  const isAdmin = userRole === "Admin";

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [trackedAmount, setTrackedAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sellers, setSellers] = useState([]);
  const [expenseItems, setExpenseItems] = useState([createEmptyExpense()]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const expenseFormRef = useRef(null);

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

  useEffect(() => {
    fetchSellers();
  }, []);

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

  const fetchSellers = async () => {
    try {
      const res = await api.get("/sellers?status=active&limit=1000");
      setSellers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch sellers");
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
      setTrackedAmount(res.data.totalAmount || 0);
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
    setExpenseItems((current) => [...current, createEmptyExpense()]);
  };

  const removeExpenseItem = (index) => {
    setExpenseItems((current) =>
      current.length > 1 ? current.filter((_, i) => i !== index) : current,
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
                { category: "", description: "", amount: "" },
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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
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
            amount: String(item.amount ?? ""),
          }))
        : [
            {
              category:
                typeof request.category === "object"
                  ? request.category?._id
                  : request.category || "",
              description: "",
              amount: String(request.amount ?? ""),
            },
          ];

    setExpenseItems([
      {
        seller: requestSellerId || "",
        sellerCompany: request.sellerCompany || "",
        receivedFrom: request.receivedFrom || "",
        description: request.description || "",
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

  const handleShareExpense = async (request) => {
    const employee = request.employee || {};
    const phone = String(employee.mobile || employee.phone || "").replace(
      /\D/g,
      "",
    );
    const whatsappNumber =
      phone.length === 10 ? `91${phone}` : phone.length === 12 ? phone : "";
    const voucherNumber = request.voucherNumber || request._id;
    const fileName = `Expense-Voucher-${voucherNumber}.pdf`;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Expense Voucher", 14, 18);
    doc.setFontSize(10);
    doc.text(`Voucher No.: ${request.voucherNumber || "N/A"}`, 14, 27);
    doc.text(
      `Date: ${new Date(request.createdAt).toLocaleDateString()}`,
      14,
      33,
    );
    doc.text(`Employee: ${employee.name || "N/A"}`, 14, 39);
    doc.text(
      `Added By: ${request.createdBy?.name || employee.name || "N/A"}`,
      14,
      45,
    );
    doc.text(`Seller: ${request.sellerName || request.seller?.sellerName || "N/A"}`, 14, 51);
    doc.text(`Company: ${request.sellerCompany || "N/A"}`, 14, 57);
    doc.text(`Received From: ${request.receivedFrom || "N/A"}`, 14, 63);
    doc.autoTable({
      head: [["Category", "Description", "Amount (Rs.)"]],
      body:
        request.lineItems?.length > 0
          ? request.lineItems.map((item) => [
              item.category?.name || "Expense",
              item.description || "-",
              Number(item.amount || 0).toFixed(2),
            ])
          : [[request.category?.name || "Expense", "-", Number(request.amount || 0).toFixed(2)]],
      startY: 70,
    });
    const finalY = doc.lastAutoTable.finalY + 9;
    doc.setFontSize(12);
    doc.text(`Total Amount: Rs. ${Number(request.amount || 0).toFixed(2)}`, 14, finalY);
    doc.setFontSize(10);
    doc.text(`Status: ${request.status || "pending"}`, 14, finalY + 8);
    if (request.description) {
      doc.text(`Description: ${request.description}`, 14, finalY + 16, {
        maxWidth: 180,
      });
    }

    let shareWindow;
    if (whatsappNumber) {
      shareWindow = window.open("about:blank", "_blank");
    }

    try {
      const file = new File([doc.output("blob")], fileName, {
        type: "application/pdf",
      });
      const shareText = `Expense voucher ${request.voucherNumber || ""} for ${employee.name || "employee"}.`;
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        shareWindow?.close();
        await navigator.share({
          files: [file],
          title: fileName,
          text: `${shareText} Share with ${employee.name || "the employee"} (${employee.mobile || employee.phone || "number unavailable"}).`,
        });
        toast.success("Expense voucher shared");
        return;
      }

      await downloadFile(doc, fileName);
      if (!whatsappNumber) {
        shareWindow?.close();
        toast.error("Employee WhatsApp number is unavailable; the voucher PDF was downloaded.");
        return;
      }

      const message = `${shareText} The voucher PDF has been downloaded; please attach it to this chat.`;
      shareWindow.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      toast.info("Voucher downloaded. Attach the PDF in the opened WhatsApp chat.");
    } catch (error) {
      shareWindow?.close();
      if (error.name !== "AbortError") {
        toast.error(error.message || "Failed to share the expense voucher");
      }
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
        Voucher: req.voucherNumber || "—",
        Employee: req.employee?.name || "N/A",
        Seller: req.sellerName || req.seller?.sellerName || "—",
        Company: req.sellerCompany || "—",
        "Received From": req.receivedFrom || "—",
        Items: (req.lineItems || [])
          .map((item) => `${item.category?.name || "N/A"}: ${item.amount}`)
          .join("; ") || req.category?.name || "N/A",
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

      const tableColumn = [
        "Date",
        "Voucher",
        "Employee",
        "Seller / Company",
        "Received From",
        "Items",
        "Amount",
        "Description",
        "Status",
      ];
      const tableRows = allRequests.map(req => [
        new Date(req.createdAt).toLocaleDateString(),
        req.voucherNumber || "-",
        req.employee?.name || "N/A",
        [req.sellerName || req.seller?.sellerName, req.sellerCompany]
          .filter(Boolean)
          .join(" / ") || "-",
        req.receivedFrom || "-",
        (req.lineItems || [])
          .map((item) => `${item.category?.name || "N/A"} (${item.amount})`)
          .join(", ") || req.category?.name || "N/A",
        `Rs. ${Number(req.amount) || 0}`,
        req.description || "-",
        req.status
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: isAdmin && filters.employeeId ? 35 : 30,
      });

      const totalAmount = allRequests.reduce(
        (sum, req) => sum + (Number(req.amount) || 0),
        0,
      );
      doc.text(`Total Amount: Rs. ${totalAmount}`, 14, doc.lastAutoTable.finalY + 10);

      await downloadFile(doc, `Expense_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  const sellerOptions = sellers.map((seller) => ({
    value: seller._id,
    label: seller.sellerName,
  }));
  const receivedFromOptions = [
    { value: "Seller", label: "Seller" },
    { value: "Office", label: "Office" },
  ];

  const employeeOptions = [
    { value: "", label: "All Employees" },
    ...employees.map(emp => ({ value: emp._id, label: emp.name }))
  ];
  const assignableEmployeeOptions = employees
    .filter((employee) => employee.status === "Active")
    .map((employee) => ({
      value: employee._id,
      label: `${employee.name}${employee.employeeId ? ` (${employee.employeeId})` : ""}`,
    }));

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const allExpensesTotal = calculateTotalAmount(
    expenseItems.flatMap((expense) => expense.items),
  );

  return (
    <AdminPageShell title="Expense Management" icon={FaMoneyBillWave}>
      <div className="space-y-8">
        {/* Admin Section: Category Management */}
        {isAdmin && (
          <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6 space-y-6">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-lux-ink">
              <FaPlus className="text-lux-emerald text-sm" /> Create Expense Category
            </h2>
            <form onSubmit={handleAddCategory} className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 min-w-0">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-[#ece4d2] bg-lux-cream px-4 py-2 transition-all hover:border-lux-gold/40"
                >
                  <span className="text-sm font-medium text-lux-ink">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="text-lux-muted opacity-0 transition-colors group-hover:text-rose-500 group-hover:opacity-100"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Submission Section */}
        <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6 space-y-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-lux-ink">
              <FaPaperPlane className="text-lux-emerald text-sm" />{" "}
              {editingExpenseId ? "Edit Expense Voucher" : "Create Expenses"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {editingExpenseId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-muted"
                >
                  Cancel Edit
                </button>
              )}
              {!editingExpenseId && (
                <button
                  type="button"
                  onClick={addExpenseItem}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  <FaPlus size={12} /> Add Another Expense
                </button>
              )}
            </div>
          </div>
          
          <form
            ref={expenseFormRef}
            onSubmit={handleRequestSubmit}
            className="space-y-6"
          >
            {expenseItems.map((expense, index) => {
              const selectedSeller = sellers.find(
                (seller) => seller._id === expense.seller,
              );
              const companyOptions = (selectedSeller?.companies || []).map(
                (company) => ({ value: company, label: company }),
              );
              const expenseTotal = calculateTotalAmount(expense.items);

              return (
                <section
                  key={index}
                  className="relative space-y-4 rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 sm:p-5"
                >
                  {expenseItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpenseItem(index)}
                      className="absolute right-3 top-3 rounded-full border border-rose-100 bg-rose-50 p-1.5 text-rose-500 shadow-sm transition-colors hover:bg-rose-100"
                      aria-label={`Remove expense ${index + 1}`}
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                  <h3 className="font-serif font-semibold text-lux-ink">
                    Expense {index + 1}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <DataDropdown
                      label="Seller Name"
                      options={sellerOptions}
                      selectedOptions={sellerOptions.find(
                        (option) => option.value === expense.seller,
                      )}
                      onChange={(option) => {
                        handleExpenseChange(index, "seller", option?.value || "");
                        handleExpenseChange(index, "sellerCompany", "");
                      }}
                      required
                      placeholder="Select seller..."
                    />
                    <DataDropdown
                      label="Seller Company"
                      options={companyOptions}
                      selectedOptions={companyOptions.find(
                        (option) => option.value === expense.sellerCompany,
                      )}
                      onChange={(option) =>
                        handleExpenseChange(
                          index,
                          "sellerCompany",
                          option?.value || "",
                        )
                      }
                      required
                      disabled={!expense.seller}
                      placeholder="Select company..."
                    />
                    <DataDropdown
                      label="Received From"
                      options={receivedFromOptions}
                      selectedOptions={receivedFromOptions.find(
                        (option) => option.value === expense.receivedFrom,
                      )}
                      onChange={(option) =>
                        handleExpenseChange(
                          index,
                          "receivedFrom",
                          option?.value || "",
                        )
                      }
                      required
                    />
                    <DataInput
                      label="Added By"
                      value={
                        editingExpenseId
                          ? expense.createdByName || user?.name || "Current user"
                          : user?.name || "Current user"
                      }
                      readOnly
                    />
                    {isAdmin && (
                      <DataDropdown
                        label="Assign to Employee"
                        options={assignableEmployeeOptions}
                        selectedOptions={assignableEmployeeOptions.find(
                          (option) => option.value === expense.employeeId,
                        )}
                        onChange={(option) =>
                          handleExpenseChange(
                            index,
                            "employeeId",
                            option?.value || "",
                          )
                        }
                        required
                        placeholder="Select employee..."
                      />
                    )}
                    <DataInput
                      label="Voucher No."
                      value={
                        editingExpenseId
                          ? requests.find((request) => request._id === editingExpenseId)
                              ?.voucherNumber || "Existing voucher"
                          : "Assigned automatically in serial order"
                      }
                      readOnly
                    />
                    <DataInput
                      label="Expense Description"
                      value={expense.description}
                      onChange={(event) =>
                        handleExpenseChange(index, "description", event.target.value)
                      }
                      placeholder="Enter a description..."
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-serif text-sm font-semibold text-lux-ink">
                        Expense Items
                      </h4>
                      <button
                        type="button"
                        onClick={() => addLineItem(index)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald"
                      >
                        <FaPlus size={10} /> Add Item
                      </button>
                    </div>
                    {expense.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="relative grid grid-cols-1 items-end gap-3 rounded-xl border border-[#ece4d2] bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"
                      >
                        {expense.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index, itemIndex)}
                            className="absolute right-2 top-2 text-rose-500"
                            aria-label={`Remove item ${itemIndex + 1}`}
                          >
                            <FaTimes size={12} />
                          </button>
                        )}
                        <DataDropdown
                          label="Expense Category"
                          options={categoryOptions}
                          selectedOptions={categoryOptions.find(
                            (option) => option.value === item.category,
                          )}
                          onChange={(option) =>
                            handleLineItemChange(
                              index,
                              itemIndex,
                              "category",
                              option?.value || "",
                            )
                          }
                          required
                        />
                        <DataInput
                          label="Amount (Rs.)"
                          inputType="number"
                          min="0.01"
                          step="0.01"
                          value={item.amount}
                          onChange={(event) =>
                            handleLineItemChange(
                              index,
                              itemIndex,
                              "amount",
                              event.target.value,
                            )
                          }
                          required
                        />
                        <div className="lg:col-span-2">
                          <DataInput
                            label="Item Description"
                            value={item.description}
                            onChange={(event) =>
                              handleLineItemChange(
                                index,
                                itemIndex,
                                "description",
                                event.target.value,
                              )
                            }
                            placeholder="Optional item details..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <div className="w-full sm:w-64">
                      <DataInput
                        label="Total Amount (Rs.)"
                        inputType="number"
                        value={expenseTotal.toFixed(2)}
                        readOnly
                      />
                    </div>
                  </div>
                </section>
              );
            })}
            
            <div className="flex flex-col items-end gap-3 pt-2">
              <div className="w-full sm:w-64">
                <DataInput
                  label="Overall Total Amount (Rs.)"
                  inputType="number"
                  value={allExpensesTotal.toFixed(2)}
                  readOnly
                />
              </div>
              <Buttons
                type="submit"
                label={
                  isSubmittingRequest
                    ? editingExpenseId
                      ? "Saving..."
                      : "Submitting..."
                    : editingExpenseId
                      ? "Save Changes"
                      : "Send for Approval"
                }
                variant="primary"
                disabled={isSubmittingRequest}
              />
            </div>
          </form>
        </div>

        {/* Filters and List Section */}
        <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="font-serif text-lg font-semibold text-lux-ink">
              {isAdmin ? "Recent Expense Requests" : "Your Expense History"}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadExcel}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                title="Download Excel"
              >
                <FaFileExcel /> Excel
              </button>
              <button
                onClick={generatePDF}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-lg"
                title="Generate PDF"
              >
                <FaFilePdf /> PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 sm:p-5 md:grid-cols-4">
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

          <div className="flex flex-col gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-lux-ink">
              {isAdmin && filters.employeeId
                ? `Expense tracker: ${employees.find((employee) => employee._id === filters.employeeId)?.name || "Selected employee"}`
                : isAdmin
                  ? "Expense tracker: all employees"
                  : "Your expense tracker"}
            </span>
            <span className="text-lg font-bold text-lux-emerald">
              {total} vouchers · Rs. {Number(trackedAmount).toFixed(2)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ece4d2]">
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Date</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Voucher No.</th>
                  {isAdmin && <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Employee</th>}
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Seller / Company</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Received From</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Items</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Total Amount</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Description</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted text-center">Status</th>
                  <th className="pb-4 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece4d2]">
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-lux-ivory/60 transition-colors">
                      <td className="py-4 text-sm text-lux-muted">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-sm font-bold text-lux-ink">
                        {req.voucherNumber || "-"}
                      </td>
                      {isAdmin && (
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-lux-ink">{req.employee?.name}</span>
                            <span className="text-[10px] text-lux-muted">
                              {req.employee?.email}
                            </span>
                            <span className="text-[10px] text-lux-muted">
                              Added by: {req.createdBy?.name || req.employee?.name || "N/A"}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 text-sm text-lux-ink">
                        <div className="font-medium">
                          {req.sellerName || req.seller?.sellerName || "-"}
                        </div>
                        <div className="text-xs text-lux-muted">{req.sellerCompany || ""}</div>
                      </td>
                      <td className="py-4 text-sm text-lux-muted">{req.receivedFrom || "-"}</td>
                      <td className="py-4 text-sm text-lux-ink">
                        {(req.lineItems || []).length > 0
                          ? req.lineItems.map((item, itemIndex) => (
                              <div key={item._id || itemIndex}>
                                {item.category?.name || "Expense"}: Rs. {item.amount}
                                {item.description ? ` - ${item.description}` : ""}
                              </div>
                            ))
                          : req.category?.name || "-"}
                      </td>
                      <td className="py-4 text-sm font-bold text-lux-emerald">
                        Rs. {Number(req.amount) || 0}
                      </td>
                      <td className="py-4 text-sm text-lux-muted">{req.description || "-"}</td>
                      <td className="py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            req.status === "approved"
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : req.status === "rejected"
                              ? "border-rose-200 bg-rose-100 text-rose-700"
                              : "border-amber-200 bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {(isAdmin || req.status === "pending") && (
                            <button
                              type="button"
                              onClick={() => handleEditExpense(req)}
                              className="rounded-xl bg-sky-50 p-2 text-sky-700 transition-colors hover:bg-sky-100"
                              title="Edit expense"
                            >
                              <FaEdit size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleShareExpense(req)}
                            className="rounded-xl bg-emerald-50 p-2 text-emerald-700 transition-colors hover:bg-emerald-100"
                            title="Share voucher PDF on WhatsApp"
                          >
                            <FaWhatsapp size={15} />
                          </button>
                          {req.status === "pending" && (
                            isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(req._id, "approved")}
                                  className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
                                  title="Approve"
                                >
                                  <FaCheck size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(req._id, "rejected")}
                                  className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100"
                                  title="Reject"
                                >
                                  <FaTimes size={14} />
                                </button>
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 11 : 9} className="py-10 text-center italic text-lux-muted">
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
