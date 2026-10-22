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
        <div className="lux-card max-w-md space-y-4 p-8 text-center">
          <h2 className="font-serif text-xl font-semibold uppercase tracking-tight text-lux-ink">
            Error
          </h2>
          <p className="text-sm font-semibold text-lux-muted">{error}</p>
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
    `₹ ${Number(payment.amount || 0).toFixed(2)}`,
    payment.entries?.length || 0,
    <div key={payment._id} className="flex items-center gap-2">
      <button
        onClick={() => onViewDetails(payment)}
        className="rounded-xl border border-[#e6dcc4] bg-[#f2eee2] p-2 text-lux-emerald transition-all hover:bg-lux-emerald hover:text-lux-cream"
        title="View Details"
      >
        <FaEye size={14} />
      </button>
      <button
        onClick={() => onEdit(payment)}
        className="rounded-xl border border-[#e6dcc4] bg-[#f2eee2] p-2 text-lux-emerald transition-all hover:bg-lux-emerald hover:text-lux-cream"
        title="Edit"
      >
        <FaEdit size={14} />
      </button>
      <button
        onClick={() => onDelete(payment._id)}
        className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
        title="Delete"
      >
        <FaTrash size={14} />
      </button>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      {/* Scan Voucher Section */}
      <div className="lux-card w-full p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-1 items-center gap-2">
            <FaQrcode className="text-lux-emerald" />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan or enter voucher number..."
              className="flex-1 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
          >
            Scan Voucher
          </button>
        </div>
      </div>

      {/* Payment Table */}
      <div className="lux-card lux-gold-top relative min-h-[400px] w-full overflow-hidden p-4 sm:p-6">
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
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lux-muted">
              No payments found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;