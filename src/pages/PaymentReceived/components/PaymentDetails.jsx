import React from "react";
import { FaTimes } from "react-icons/fa";

const PaymentDetails = ({ payment, onClose, onEdit, onDelete }) => {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
      <div className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream p-4 shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] sm:p-6 md:p-8 md:animate-modal-desktop">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-[#ece4d2] pb-4">
          <h2 className="font-serif text-xl font-semibold uppercase tracking-tight text-lux-ink sm:text-2xl">
            Payment Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Voucher Header */}
        <div className="mb-6 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Voucher Number
              </label>
              <p className="font-serif text-xl font-semibold text-lux-ink sm:text-2xl">
                {payment.voucherNumber}
              </p>
            </div>
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Seller Bill No
              </label>
              <p className="font-serif text-xl font-semibold text-lux-ink sm:text-2xl">
                {payment.sellerBillNo || "N/A"}
              </p>
            </div>
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Payment Date
              </label>
              <p className="font-serif text-xl font-semibold text-lux-ink sm:text-2xl">
                {new Date(payment.date).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="mb-6">
          <h3 className="font-serif text-lg font-semibold text-lux-ink mb-4">
            Payment Entries
          </h3>
          <div className="space-y-4">
            {(payment.entries || []).map((entry, index) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                      Date
                    </label>
                    <p className="text-base font-semibold text-lux-ink sm:text-lg">
                      {new Date(entry.date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                      Amount
                    </label>
                    <p className="text-base font-semibold text-lux-emerald sm:text-lg">
                      ₹ {Number(entry.amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                      Description
                    </label>
                    <p className="text-base font-semibold text-lux-ink sm:text-lg">
                      {entry.description || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="font-serif text-base font-semibold text-emerald-800">
              Total Amount
            </label>
            <span className="font-serif text-2xl font-semibold tabular-nums text-emerald-800 sm:text-3xl">
              ₹ {Number(payment.amount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
          >
            Close
          </button>
          <button
            onClick={() => {
              onEdit(payment);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
          >
            Edit Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;