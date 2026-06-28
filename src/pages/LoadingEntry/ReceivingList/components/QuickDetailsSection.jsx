import React from "react";

const QuickDetailsSection = ({ selectedEntry }) => {
  if (!selectedEntry) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-[2rem] p-6 shadow-sm">
      <h4 className="text-base font-black text-blue-900 mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        Quick Details
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
          <span className="font-semibold text-slate-700">Seller Bill No</span>
          <span className="text-lg font-black text-blue-700">
            {selectedEntry.sellerBillNo || "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
          <span className="font-semibold text-slate-700">Rejected Quantity</span>
          <span className="text-lg font-black text-red-600">
            {(Number(selectedEntry.loadingWeight || 0) - Number(selectedEntry.unloadingWeight || 0)).toFixed(2)} Tons
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickDetailsSection;
