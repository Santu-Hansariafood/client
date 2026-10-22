import React from "react";

const QuickDetailsSection = ({ selectedEntry }) => {
  if (!selectedEntry) return null;

  return (
    <div className="lux-card lux-gold-top p-5 sm:p-6">
      <h4 className="mb-6 flex items-center gap-3 font-serif text-lg font-semibold text-lux-ink">
        <span className="w-2 h-2 rounded-full bg-lux-gold" />
        Quick Details
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
          <span className="text-sm font-semibold text-lux-muted">Seller Bill No</span>
          <span className="font-serif text-lg font-bold text-lux-ink">
            {selectedEntry.sellerBillNo || "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
          <span className="text-sm font-semibold text-lux-muted">Rejected Quantity</span>
          <span className="font-serif text-lg font-bold text-rose-600">
            {(Number(selectedEntry.loadingWeight || 0) - Number(selectedEntry.unloadingWeight || 0)).toFixed(2)} Tons
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickDetailsSection;
