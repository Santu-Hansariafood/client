import React, { lazy, Suspense } from "react";
import { FaEye, FaCopy, FaClipboardList } from "react-icons/fa";

const Tables = lazy(() => import("../../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../../common/Paginations/Paginations"));
const Loading = lazy(() => import("../../../../common/Loading/Loading"));

const AttachmentBadge = ({ count }) => (
  <span
    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-2 w-fit"
    role="status"
    aria-label={`${count} attachments`}
  >
    <FaClipboardList className="text-slate-400" />
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
        <div className="text-center space-y-4 p-8 bg-white rounded-3xl border border-red-100 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <FaClipboardList size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Sync Failure
          </h2>
          <p className="text-slate-500 text-sm font-semibold">{error}</p>
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
      className="font-bold uppercase text-slate-600"
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
          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
          : "bg-amber-50 text-amber-600 border-amber-100"
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
        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 focus:ring-2 focus:ring-blue-500/20"
        title="View Documents"
        aria-label="View Documents"
      >
        <FaEye size={16} />
      </button>
      <button
        onClick={() => onCopy(entry)}
        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 focus:ring-2 focus:ring-emerald-500/20"
        title="Copy Details"
        aria-label="Copy Details"
      >
        <FaCopy size={16} />
      </button>
    </div>,
  ]);

  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] relative">
      {loading && <Loading />}
      
      <Suspense fallback={<Loading />}>
        <Tables headers={headers} rows={tableRows} />
      </Suspense>

      {totalItems > 0 && (
        <div className="mt-10 flex justify-center pb-6">
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
          <FaClipboardList className="text-6xl text-slate-200 mx-auto mb-6" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
            No entries found
          </p>
        </div>
      )}
    </div>
  );
};

export default ReceivingTable;
