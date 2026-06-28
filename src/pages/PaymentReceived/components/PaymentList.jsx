import React, { useState, lazy, Suspense } from "react";
import { FaEye, FaEdit, FaTrash, FaQrcode } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const Loading = lazy(() => import("../../../common/Loading/Loading"));

const PaymentList = ({
  payments,
  loading,
  error,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onEdit,
  onDelete,
  onScanVoucher,
}) => {
  const [scanInput, setScanInput] = useState("");

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-white rounded-3xl border border-red-100 shadow-xl max-w-md">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Error
          </h2>
          <p className="text-slate-500 text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const headers = [
    "Voucher No",
    "Seller Bill No",
    "Date",
    "Total Amount",
    "Number of Entries",
    "Actions",
  ];

  const rows = payments.map((payment) => [
    payment.voucherNumber,
    payment.sellerBillNo || "N/A",
    new Date(payment.date).toLocaleDateString("en-GB"),
    `₹ ${Number(payment.totalAmount || 0).toFixed(2)}`,
    payment.entries?.length || 0,
    <div key={payment.id} className="flex items-center gap-2">
      <button
        onClick={() => onViewDetails(payment)}
        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
        title="View Details"
      >
        <FaEye size={14} />
      </button>
      <button
        onClick={() => onEdit(payment)}
        className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
        title="Edit"
      >
        <FaEdit size={14} />
      </button>
      <button
        onClick={() => onDelete(payment.id)}
        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
        title="Delete"
      >
        <FaTrash size={14} />
      </button>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      {/* Scan Voucher Section */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 flex-1">
            <FaQrcode className="text-blue-600" />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan or enter voucher number..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter" && scanInput) {
                  onScanVoucher(scanInput);
                }
              }}
            />
          </div>
          <button
            onClick={() => scanInput && onScanVoucher(scanInput)}
            disabled={!scanInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            Scan Voucher
          </button>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px] relative">
        {loading && <Loading />}
        
        <Suspense fallback={<Loading />}>
          <Tables headers={headers} rows={rows} />
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

        {!loading && payments.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
              No payments found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;