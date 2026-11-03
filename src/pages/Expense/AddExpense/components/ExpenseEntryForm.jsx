import { FaPaperPlane, FaPlus, FaTimes } from "react-icons/fa";
import Buttons from "../../../../common/Buttons/Buttons";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";
import DataInput from "../../../../common/DataInput/DataInput";
import {
  calculateLineTotal,
  calculateTotalAmount,
} from "../utils/expenseCalculations";

const ExpenseEntryForm = ({
  isAdmin,
  user,
  categories,
  sellers,
  employees,
  requests,
  expenseItems,
  isSubmittingRequest,
  editingExpenseId,
  expenseFormRef,
  onSubmit,
  onCancelEdit,
  onAddExpense,
  onRemoveExpense,
  onExpenseChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
}) => {
  const categoryOptions = categories.map((category) => ({
    value: category._id,
    label: category.name,
  }));
  const sellerOptions = sellers.map((seller) => ({
    value: seller._id,
    label: seller.sellerName,
  }));
  const receivedFromOptions = [
    { value: "Seller", label: "Seller" },
    { value: "Office", label: "Office" },
  ];
  const assignableEmployeeOptions = employees
    .filter((employee) => employee.status === "Active")
    .map((employee) => ({
      value: employee._id,
      label: `${employee.name}${employee.employeeId ? ` (${employee.employeeId})` : ""}`,
    }));
  const allExpensesTotal = calculateTotalAmount(
    expenseItems.flatMap((expense) => expense.items),
  );

  return (
    <section className="space-y-6 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-lux-ink">
          <FaPaperPlane className="text-sm text-lux-emerald" />{" "}
          {editingExpenseId ? "Edit Expense Voucher" : "Create Expenses"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {editingExpenseId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-muted"
            >
              Cancel Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            >
              <FaPlus size={12} /> Add Another Expense
            </button>
          )}
        </div>
      </div>

      <form
        ref={expenseFormRef}
        onSubmit={onSubmit}
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
                  onClick={() => onRemoveExpense(index)}
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
                    onExpenseChange(index, "seller", option?.value || "");
                    onExpenseChange(index, "sellerCompany", "");
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
                    onExpenseChange(
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
                    onExpenseChange(
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
                      onExpenseChange(
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
                      ? requests.find(
                          (request) => request._id === editingExpenseId,
                        )?.voucherNumber || "Existing voucher"
                      : "Assigned automatically in serial order"
                  }
                  readOnly
                />
                <DataInput
                  label="Expense Description"
                  value={expense.description}
                  onChange={(event) =>
                    onExpenseChange(index, "description", event.target.value)
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
                    onClick={() => onAddLineItem(index)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald"
                  >
                    <FaPlus size={10} /> Add Item
                  </button>
                </div>
                {expense.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="relative grid grid-cols-1 items-end gap-3 rounded-xl border border-[#ece4d2] bg-white p-3 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    {expense.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveLineItem(index, itemIndex)}
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
                        onLineItemChange(
                          index,
                          itemIndex,
                          "category",
                          option?.value || "",
                        )
                      }
                      required
                    />
                    <DataInput
                      label="Quantity"
                      inputType="number"
                      min="0.01"
                      step="any"
                      value={item.quantity ?? "1"}
                      onChange={(event) =>
                        onLineItemChange(
                          index,
                          itemIndex,
                          "quantity",
                          event.target.value,
                        )
                      }
                      required
                    />
                    <DataInput
                      label="Amount per Unit (Rs.)"
                      inputType="number"
                      min="0.01"
                      step="0.01"
                      value={item.amount}
                      onChange={(event) =>
                        onLineItemChange(
                          index,
                          itemIndex,
                          "amount",
                          event.target.value,
                        )
                      }
                      required
                    />
                    <div className="lg:col-span-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DataInput
                          label="Item Description"
                          value={item.description}
                          onChange={(event) =>
                            onLineItemChange(
                              index,
                              itemIndex,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Optional item details..."
                        />
                        <DataInput
                          label="Line Total (Rs.)"
                          inputType="number"
                          value={calculateLineTotal(item)}
                          readOnly
                        />
                      </div>
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
    </section>
  );
};

export default ExpenseEntryForm;
