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
    amount: 0,
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
        amount: payment.amount || 0,
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
        amount: 0,
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
    setFormData(prev => ({ ...prev, amount: total }));
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
      id: payment?._id,
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
      <div className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream p-4 shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] sm:p-6 md:p-8 md:animate-modal-desktop">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-[#ece4d2] pb-4">
          <h2 className="font-serif text-xl font-semibold uppercase tracking-tight text-lux-ink sm:text-2xl">
            {payment ? "Edit Payment" : "Add New Payment"}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Voucher Number
              </label>
              <input
                type="text"
                value={formData.voucherNumber}
                readOnly
                disabled
                className="w-full rounded-xl border border-[#e4dbc6] bg-lux-ivory px-4 py-3 text-sm font-semibold text-lux-muted"
              />
            </div>
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
              />
            </div>
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  date: e.target.value,
                }))}
                className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
              />
            </div>
          </div>

          {/* Entries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-lux-ink">
                Payment Entries
              </h3>
              <button
                type="button"
                onClick={handleAddEntry}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-4 py-2 text-xs font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
              >
                Add Entry
              </button>
            </div>

            <div className="space-y-4">
              {formData.entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif font-semibold text-lux-ink">
                      Entry {index + 1}
                    </h4>
                    {formData.entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
                    <div>
                      <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                        Date
                      </label>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleUpdateEntry(entry.id, "date", e.target.value)}
                        className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={entry.amount}
                        onChange={(e) => handleUpdateEntry(entry.id, "amount", e.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                        Description
                      </label>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) => handleUpdateEntry(entry.id, "description", e.target.value)}
                        placeholder="Enter description"
                        className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="font-serif text-base font-semibold text-emerald-800">
                Total Amount
              </label>
              <span className="font-serif text-2xl font-semibold tabular-nums text-emerald-800 sm:text-3xl">
                ₹ {formData.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
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