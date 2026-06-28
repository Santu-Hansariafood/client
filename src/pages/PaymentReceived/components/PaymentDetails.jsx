import React from "react";
import { FaTimes } from "react-icons/fa";

const PaymentDetails = ({ payment, onClose, onEdit, onDelete }) => {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            Payment Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Voucher Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[2rem] p-6 border border-blue-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Voucher Number
              </label>
              <p className="text-2xl font-black text-blue-800">
                {payment.voucherNumber}
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Seller Bill No
              </label>
              <p className="text-2xl font-black text-blue-800">
                {payment.sellerBillNo || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Payment Date
              </label>
              <p className="text-2xl font-black text-blue-800">
                {new Date(payment.date).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Payment Entries
          </h3>
          <div className="space-y-4">
            {(payment.entries || []).map((entry, index) => (
              <div
                key={entry.id}
                className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Date
                    </label>
                    <p className="text-lg font-bold text-slate-800">
                      {new Date(entry.date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Amount
                    </label>
                    <p className="text-lg font-bold text-emerald-700">
                      ₹ {Number(entry.amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Description
                    </label>
                    <p className="text-lg font-bold text-slate-800">
                      {entry.description || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2rem] p-6 border border-emerald-200 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-lg font-bold text-emerald-800">
              Total Amount
            </label>
            <span className="text-3xl font-black text-emerald-800">
              ₹ {Number(payment.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              onEdit(payment);
              onClose();
            }}
            className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
          >
            Edit Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;