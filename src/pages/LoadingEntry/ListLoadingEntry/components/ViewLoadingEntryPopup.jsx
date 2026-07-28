import React from "react";
import { FaFileAlt } from "react-icons/fa";

const PDF_RE = /\.pdf(\?.*)?(#.*)?$/i;
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?(#.*)?$/i;
const isPdfUrl = (url) => PDF_RE.test(url || "");
const isImageUrl = (url) => IMAGE_EXT_RE.test(url || "");

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

const DocumentCard = ({ label, url, color }) => {
  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <h4
          className={`text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3`}
        >
          <span
            className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}
          />
          {label}
        </h4>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50 hover:text-emerald-600 hover:bg-emerald-50 transition"
        >
          Open
        </a>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-50 flex items-center justify-center min-h-[260px]">
        {isPdfUrl(url) ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
              <FaFileAlt size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">
                View PDF Document
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Opens in new tab
              </p>
            </div>
          </a>
        ) : isImageUrl(url) ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={url}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              crossOrigin="anonymous"
            />
          </a>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
              <FaFileAlt size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">
                View Document
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Opens in new tab
              </p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};

const DocumentsSection = ({ entry }) => {
  const docs = [
    { key: "kantaSlip", label: "Kanta Slip", color: "blue" },
    { key: "unloadingChallan", label: "Unloading Challan", color: "indigo" },
    { key: "partyBillCopy", label: "Party Bill Copy", color: "emerald" },
  ];

  const attachments = docs
    .map((d) => {
      const url = entry?.documents?.[d.key];
      return url && typeof url === "string" && url.trim()
        ? { ...d, url }
        : null;
    })
    .filter(Boolean);

  if (entry?.documentUrl && typeof entry.documentUrl === "string" && entry.documentUrl.trim()) {
    attachments.push({
      key: "__legacy_attachment",
      label: "Attachment",
      url: entry.documentUrl,
      color: "purple",
    });
  }

  if (attachments.length === 0) return null;

  return (
    <div className="border-t border-slate-100 pt-6 mt-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        Uploaded Documents ({attachments.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attachments.map((doc) => (
          <DocumentCard
            key={doc.key}
            label={doc.label}
            url={doc.url}
            color={doc.color}
          />
        ))}
      </div>
    </div>
  );
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
            <span className="text-slate-500">Due Date:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(selectedEntry.dueDate)}
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
            <span className="text-slate-500">Loading From:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.loadingFrom || "N/A"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
            Weight & Billing
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">Loading Wt:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.loadingWeight} Tons
            </span>
            <span className="text-slate-500">Unloading Wt:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.unloadingWeight || 0} Tons
            </span>
            <span className="text-slate-500">Bags:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.bags || "N/A"}
            </span>
            <span className="text-slate-500">Bill No:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.billNumber || "N/A"}
            </span>
            <span className="text-slate-500">Seller Bill No:</span>
            <span className="font-semibold text-slate-800">
              {selectedEntry.sellerBillNo || "N/A"}
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
            <span className="text-slate-500">Buyer Brokerage:</span>
            <span className="font-bold text-slate-800">
              ₹ {selectedEntry.buyerBrokerage || 0}
            </span>
            <span className="text-slate-500">Seller Brokerage:</span>
            <span className="font-bold text-slate-800">
              ₹ {selectedEntry.sellerBrokerage || 0}
            </span>
            {selectedEntry.isRejected && (
              <>
                <span className="text-slate-500 col-span-1">Status:</span>
                <span className="font-bold text-red-700 bg-red-100 rounded px-2 py-0.5 inline-block text-right">
                  REJECTED
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <DocumentsSection entry={selectedEntry} />

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
