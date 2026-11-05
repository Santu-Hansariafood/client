import { FaCheck, FaDownload, FaEdit, FaFileExcel, FaFilePdf, FaTimes, FaWhatsapp } from "react-icons/fa";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";
import DataInput from "../../../../common/DataInput/DataInput";
import Paginations from "../../../../common/Paginations/Paginations";
import Tables from "../../../../common/Tables/Tables";
import { calculateLineTotal } from "../utils/expenseCalculations";

const ExpenseRequestsPanel = ({
  isAdmin,
  canManageExpenses,
  currentUserId,
  employees = [],
  financialYears = [],
  filters,
  setFilters,
  requests = [],
  total,
  trackedAmount,
  page,
  limit,
  setPage,
  onExportExcel,
  onExportPdf,
  onEdit,
  onDownloadVoucher,
  onShareVoucher,
  onStatusUpdate,
}) => {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeFinancialYears = Array.isArray(financialYears) ? financialYears : [];
  const safeRequests = Array.isArray(requests) ? requests : [];
  const employeeOptions = [
    { value: "", label: "All Employees" },
    ...safeEmployees.map((employee) => ({
      value: employee._id,
      label: employee.name,
    })),
  ];
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];
  const financialYearOptions = [
    { value: "", label: "All financial years" },
    ...(safeFinancialYears.length
      ? safeFinancialYears
      : [
        {
          value: String(new Date().getMonth() >= 3
            ? new Date().getFullYear()
            : new Date().getFullYear() - 1),
          label: "Current financial year",
        },
        ]),
  ];

  const renderItems = (request) =>
    (Array.isArray(request.lineItems) ? request.lineItems : []).length > 0
      ? request.lineItems.map((item, index) => (
          <div key={item._id || index} className="break-words">
            <span className="font-medium">{item.category?.name || "Expense"}</span>
            <span className="text-lux-muted">
              {`: ${Number(item.quantity ?? 1)} x Rs. ${Number(item.amount || 0).toFixed(2)} = Rs. ${calculateLineTotal(item)}`}
            </span>
            {item.description && (
              <span className="block text-xs text-lux-muted">{item.description}</span>
            )}
          </div>
        ))
      : request.category?.name
        ? `${request.category.name}: 1 x Rs. ${Number(request.amount || 0).toFixed(2)} = Rs. ${Number(request.amount || 0).toFixed(2)}`
        : "-";

  const renderStatus = (request) => (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
          request.status === "approved"
            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
            : request.status === "rejected"
              ? "border-rose-200 bg-rose-100 text-rose-700"
              : "border-amber-200 bg-amber-100 text-amber-800"
        }`}
      >
        {request.status}
      </span>
      {request.status === "approved" && request.approvedBy?.name && (
        <span className="text-[10px] text-lux-muted">
          Approved by: {request.approvedBy.name}
        </span>
      )}
      {request.status === "rejected" && request.rejectedBy?.name && (
        <span className="text-[10px] text-lux-muted">
          Rejected by: {request.rejectedBy.name}
        </span>
      )}
      {request.status === "rejected" && request.rejectionReason && (
        <span className="break-words text-[10px] text-rose-600">
          {request.rejectionReason}
        </span>
      )}
      {canManageExpenses && (
        <span className="text-[10px] text-lux-muted">
          Approving Admin: {request.assignedApprover?.name || "Any Admin"}
        </span>
      )}
    </div>
  );

  const renderActions = (request) => {
    const assignedApproverId =
      typeof request.assignedApprover === "object"
        ? request.assignedApprover?._id
        : request.assignedApprover;
    const canEdit =
      (canManageExpenses || request.status === "pending") &&
      (!assignedApproverId || assignedApproverId === currentUserId);
    const canApprove =
      isAdmin &&
      (!assignedApproverId || assignedApproverId === currentUserId);
    const buttonClass =
      "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-2 py-2 text-xs font-semibold transition-colors hover:bg-slate-100 sm:gap-2 sm:text-sm md:flex-none md:p-2";
    return (
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(request)}
            className={`${buttonClass} text-sky-700`}
            title="Edit expense"
            aria-label="Edit expense"
          >
            <FaEdit size={14} />
            <span>Edit</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onDownloadVoucher(request)}
          className={`${buttonClass} text-sky-700`}
          title="Download expense voucher PDF"
          aria-label="Download expense voucher PDF"
        >
          <FaDownload size={14} />
          <span>PDF</span>
        </button>
        <button
          type="button"
          onClick={() => onShareVoucher(request)}
          className={`${buttonClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
          title="Share voucher PDF on WhatsApp"
          aria-label="Share voucher PDF on WhatsApp"
        >
          <FaWhatsapp size={15} />
          <span>Share</span>
        </button>
        {canApprove && request.status === "pending" && (
          <>
            <button
              type="button"
              onClick={() => onStatusUpdate(request._id, "approved")}
              className={`${buttonClass} text-emerald-700`}
              title="Approve"
              aria-label="Approve expense"
            >
              <FaCheck size={14} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              onClick={() => onStatusUpdate(request._id, "rejected")}
              className={`${buttonClass} bg-rose-50 text-rose-700 hover:bg-rose-100`}
              title="Reject"
              aria-label="Reject expense"
            >
              <FaTimes size={14} />
              <span>Reject</span>
            </button>
          </>
        )}
      </div>
    );
  };

  const headers = [
    "Date",
    "Voucher No.",
    ...(canManageExpenses ? ["Employee"] : []),
    "Seller / Company",
    "Received From",
    "Items",
    "Total Amount",
    "Description",
    "Status",
    "Actions",
  ];

  const rows = safeRequests.map((request) => [
    new Date(request.createdAt).toLocaleDateString(),
    request.voucherNumber || "-",
    ...(canManageExpenses
      ? [
          <div key={`employee-${request._id}`} className="flex min-w-32 flex-col">
            <span className="font-bold">{request.employee?.name || "N/A"}</span>
            {request.employee?.email && (
              <span className="text-xs text-lux-muted">{request.employee.email}</span>
            )}
            <span className="text-xs text-lux-muted">
              Added by: {request.createdBy?.name || request.employee?.name || "N/A"}
            </span>
          </div>,
        ]
      : []),
    <div key={`seller-${request._id}`} className="min-w-32">
      <div className="font-medium">
        {request.sellerName || request.seller?.sellerName || "-"}
      </div>
      {request.sellerCompany && (
        <div className="text-xs text-lux-muted">{request.sellerCompany}</div>
      )}
    </div>,
    request.receivedFrom || "-",
    <div key={`items-${request._id}`} className="min-w-40 space-y-2">
      {renderItems(request)}
    </div>,
    <span
      key={`amount-${request._id}`}
      className="whitespace-nowrap font-bold text-lux-emerald"
    >
      Rs. {Number(request.amount || 0).toFixed(2)}
    </span>,
    request.description || "-",
    renderStatus(request),
    renderActions(request),
  ]);

  return (
    <section className="space-y-6 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="font-serif text-lg font-semibold text-lux-ink">
          {canManageExpenses ? "Recent Expense Requests" : "Your Expense History"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            title="Download Excel"
          >
            <FaFileExcel /> Excel
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-lg"
            title="Generate PDF"
          >
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-5">
        <DataDropdown
          label="Financial Year (April–March)"
          options={financialYearOptions}
          selectedOptions={financialYearOptions.find(
            (option) => option.value === filters.financialYear,
          )}
          onChange={(option) =>
            setFilters({
              ...filters,
              financialYear: option?.value || "",
            })
          }
        />
        {canManageExpenses && (
          <DataDropdown
            label="Employee"
            options={employeeOptions}
            selectedOptions={employeeOptions.find(
              (option) => option.value === filters.employeeId,
            )}
            onChange={(option) =>
              setFilters({ ...filters, employeeId: option?.value || "" })
            }
          />
        )}
        <DataInput
          label="From Date"
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            setFilters({ ...filters, startDate: event.target.value })
          }
        />
        <DataInput
          label="To Date"
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            setFilters({ ...filters, endDate: event.target.value })
          }
        />
        <DataDropdown
          label="Status"
          options={statusOptions}
          selectedOptions={statusOptions.find(
            (option) => option.value === filters.status,
          )}
          onChange={(option) =>
            setFilters({ ...filters, status: option?.value || "" })
          }
        />
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-lux-ink">
          {canManageExpenses && filters.employeeId
            ? `Expense tracker: ${safeEmployees.find((employee) => employee._id === filters.employeeId)?.name || "Selected employee"}`
            : canManageExpenses
              ? "Expense tracker: all employees"
              : "Your expense tracker"}
        </span>
        <span className="text-lg font-bold text-lux-emerald">
          {total} vouchers · Rs. {Number(trackedAmount).toFixed(2)}
        </span>
      </div>

      <Tables headers={headers} rows={rows} />

      <div className="flex justify-center pt-2">
        <Paginations
          currentPage={page}
          totalItems={total}
          itemsPerPage={limit}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
};

export default ExpenseRequestsPanel;
