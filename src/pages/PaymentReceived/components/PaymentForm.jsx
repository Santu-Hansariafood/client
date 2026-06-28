import React, { useState, useEffect } from "react";
import { FaSave, FaTimes } from "react-icons/fa";

const PaymentForm = ({
  payment,
  onSave,
  onCancel,
  loading,
  nextVoucherNumber,
}) => {
  const [formData, setFormData] = useState({
    voucherNumber: nextVoucherNumber,
    sellerBillNo: "",
    date: new Date().toISOString().split("T")[0],
    totalAmount: 0,
    entries: [
      {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        description: "",
      },
    ],
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        voucherNumber: payment.voucherNumber,
        sellerBillNo: payment.sellerBillNo || "",
        date: new Date(payment.date).toISOString().split("T")[0],
        totalAmount: payment.totalAmount || 0,
        entries: payment.entries?.map(entry => ({
          ...entry,
          id: entry.id || Date.now() + Math.random(),
        })) || [],
      });
    } else {
      setFormData({
        voucherNumber: nextVoucherNumber,
        sellerBillNo: "",
        date: new Date().toISOString().split("T")[0],
        totalAmount: 0,
        entries: [
          {
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
            amount: 0,
            description: "",
          },
        ],
      });
    }
  }, [payment, nextVoucherNumber]);

  // Calculate total amount from entries
  useEffect(() => {
    const total = formData.entries.reduce(
      (sum, entry) => sum + Number(entry.amount || 0),
      0
    );
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.entries]);

  const handleAddEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: Date.now(),
          date: new Date().toISOString().split("T")[0],
          amount: 0,
          description: "",
        },
      ],
    }));
  };

  const handleRemoveEntry = (entryId) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== entryId),
    }));
  };

  const handleUpdateEntry = (entryId, field, value) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: payment?.id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {payment ? "Edit Payment" : "Add New Payment"}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Voucher Number
              </label>
              <input
                type="text"
                value={formData.voucherNumber}
                readOnly
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Seller Bill No
              </label>
              <input
                type="text"
                value={formData.sellerBillNo}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sellerBillNo: e.target.value,
                }))}
                placeholder="Enter seller bill number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  date: e.target.value,
                }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Entries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Payment Entries
              </h3>
              <button
                type="button"
                onClick={handleAddEntry}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
              >
                Add Entry
              </button>
            </div>

            <div className="space-y-4">
              {formData.entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-700">
                      Entry {index + 1}
                    </h4>
                    {formData.entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleUpdateEntry(entry.id, "date", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={entry.amount}
                        onChange={(e) => handleUpdateEntry(entry.id, "amount", e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) => handleUpdateEntry(entry.id, "description", e.target.value)}
                        placeholder="Enter description"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2rem] p-6 border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="text-lg font-bold text-emerald-800">
                Total Amount
              </label>
              <span className="text-3xl font-black text-emerald-800">
                ₹ {formData.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaSave size={16} />
              {loading ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;