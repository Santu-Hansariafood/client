import React, { lazy, Suspense } from "react";
import { FaEye, FaCopy, FaClipboardList } from "react-icons/fa";

const Tables = lazy(() => import("../../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../../common/Paginations/Paginations"));
const Loading = lazy(() => import("../../../../common/Loading/Loading"));

const AttachmentBadge = ({ count }) => (
  <span
    className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e6dcc4] bg-[#f2eee2] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lux-muted shadow-sm"
    role="status"
    aria-label={`${count} attachments`}
  >
    <FaClipboardList className="text-lux-muted" />
    {count} {count === 1 ? "File" : "Files"}
  </span>
);

const ReceivingTable = ({
  loading,
  error,
  rows,
  userRole,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  onViewDocuments,
  onCopy,
  onToggleSentStatus,
}) => {
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md space-y-4 rounded-2xl border border-rose-200 bg-lux-cream p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <FaClipboardList size={32} />
          </div>
          <h2 className="font-serif text-xl font-bold uppercase tracking-tight text-lux-ink">
            Sync Failure
          </h2>
          <p className="text-sm font-semibold text-lux-muted">{error}</p>
        </div>
      </div>
    );
  }

  const headers = [
    "Sauda No",
    "Loading No",
    "Lorry No",
    "Loading Wt",
    "Unloading Wt",
    "Loading Date",
    "Unloading Date",
    "Rate",
    "Amount",
    "Seller Co",
    "Buyer Co",
    "Status",
    "Attachment",
    "Actions",
  ];

  const tableRows = rows.map((entry) => [
    entry.saudaNo || "N/A",
    entry.billNumber || "N/A",
    <span
      key={`lorry-${entry._id}`}
      className="font-bold uppercase text-lux-ink"
    >
      {entry.lorryNumber || "N/A"}
    </span>,
    `${entry.loadingWeight || 0} T`,
    `${entry.unloadingWeight || 0} T`,
    entry.loadingDateFormatted,
    entry.unloadingDateFormatted,
    `Rs. ${entry.actualRate || 0}`,
    `Rs. ${entry.amountFormatted}`,
    entry.supplierCompany || "N/A",
    entry.buyerCompany || "N/A",
    <button
      key={`status-${entry._id}`}
      onClick={() => {
        if (userRole === "Admin" || userRole === "Employee") {
          onToggleSentStatus(entry);
        }
      }}
      disabled={userRole !== "Admin" && userRole !== "Employee"}
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
        entry.sentStatus === "Sent"
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border-amber-200 bg-amber-100 text-amber-800"
      } ${userRole !== "Admin" && userRole !== "Employee" ? "cursor-default opacity-80" : "hover:scale-105 active:scale-95"}`}
    >
      {entry.sentStatus || "Not Sent"}
    </button>,
    <AttachmentBadge
      key={`attach-${entry._id}`}
      count={entry.attachmentCount}
    />,
    <div key={`actions-${entry._id}`} className="flex items-center gap-2">
      <button
        onClick={() => onViewDocuments(entry)}
        className="rounded-xl border border-[#e6dcc4] bg-lux-cream p-2 text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-lux-emerald hover:text-lux-gold-soft focus:ring-2 focus:ring-lux-gold/30"
        title="View Documents"
        aria-label="View Documents"
      >
        <FaEye size={16} />
      </button>
      <button
        onClick={() => onCopy(entry)}
        className="rounded-xl border border-[#e6dcc4] bg-lux-cream p-2 text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-lux-emerald hover:text-lux-gold-soft focus:ring-2 focus:ring-lux-gold/30"
        title="Copy Details"
        aria-label="Copy Details"
      >
        <FaCopy size={16} />
      </button>
    </div>,
  ]);

  return (
    <div className="lux-card lux-gold-top relative min-h-[500px] w-full overflow-hidden p-4 sm:p-6">
      {loading && <Loading />}
      
      <Suspense fallback={<Loading />}>
        <Tables headers={headers} rows={tableRows} />
      </Suspense>

      {totalItems > 0 && (
        <div className="mt-8 flex justify-center pb-4">
          <Suspense fallback={<Loading />}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </Suspense>
        </div>
      )}

      {!loading && tableRows.length === 0 && (
        <div className="py-20 text-center">
          <FaClipboardList className="mx-auto mb-6 text-6xl text-lux-gold-soft/60" />
          <p className="text-sm font-black uppercase tracking-[0.2em] text-lux-muted">
            No entries found
          </p>
        </div>
      )}
    </div>
  );
};

export default ReceivingTable;
