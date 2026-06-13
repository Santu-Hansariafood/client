import React from "react";

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

const ViewLoadingEntryPopup = ({
  selectedEntry,
  sellerMap,
  paymentTermsMap,
  transporterMap,
  onClose,
}) => {
  return (
    <div className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
            Basic Info
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">Loading Date:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(selectedEntry.loadingDate)}
            </span>
            <span className="text-slate-500">Sauda No:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.saudaNo}
            </span>
            <span className="text-slate-500">Seller:</span>
            <span className="font-semibold text-slate-800">
              {sellerMap[selectedEntry.supplier] || "N/A"}
            </span>
            <span className="text-slate-500">Payment Terms:</span>
            <span className="font-semibold text-slate-800">
              {paymentTermsMap[selectedEntry.saudaNo] || "N/A"}
            </span>
            <span className="text-slate-500">Commodity:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.commodity || "N/A"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
            Transport Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">Lorry No:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.lorryNumber}
            </span>
            <span className="text-slate-500">Transporter:</span>
            <span className="font-semibold text-slate-800">
              {transporterMap[selectedEntry.transporterId] ||
                selectedEntry.addedTransport ||
                "N/A"}
            </span>
            <span className="text-slate-500">Driver Name:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.driverName || "N/A"}
            </span>
            <span className="text-slate-500">Driver Phone:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.driverPhoneNumber || "N/A"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
            Weight & Billing
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">Weight:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.loadingWeight} Tons
            </span>
            <span className="text-slate-500">Unloading Wt:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.unloadingWeight || 0} Tons
            </span>
            <span className="text-slate-500">Bill No:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.billNumber || "N/A"}
            </span>
            <span className="text-slate-500">Bill Date:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(selectedEntry.dateOfIssue)}
            </span>
            <span className="text-slate-500">Entered By:</span>
            <span className="font-semibold text-slate-800 flex flex-col">
              <span>{selectedEntry.creatorMobile || "N/A"}</span>
              <span className="text-[10px] text-slate-400 uppercase">
                ({selectedEntry.entryByRole || "Admin"})
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
            Financial Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500">Freight Rate:</span>
            <span className="font-bold text-slate-800">
              ₹ {selectedEntry.freightRate}
            </span>
            <span className="text-slate-500">Total Freight:</span>
            <span className="font-bold text-slate-800">
              ₹ {selectedEntry.totalFreight}
            </span>
            <span className="text-slate-500">Advance:</span>
            <span className="font-bold text-emerald-600">
              ₹ {selectedEntry.advance}
            </span>
            <span className="text-slate-500">Balance Due:</span>
            <span className="font-bold text-amber-600">
              ₹ {selectedEntry.balance}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewLoadingEntryPopup;
