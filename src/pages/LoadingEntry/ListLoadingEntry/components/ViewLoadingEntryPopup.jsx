import React from "react";
import { FaFileAlt, FaPrint } from "react-icons/fa";

const PDF_RE = /\.pdf(\?.*)?(#.*)?$/i;
const DATA_PDF_RE = /^data:application\/pdf/i;
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?(#.*)?$/i;
const DATA_IMG_RE = /^data:image\//i;
const isPdfUrl = (url) => PDF_RE.test(url || "") || DATA_PDF_RE.test(url || "");
const isImageUrl = (url) => IMAGE_EXT_RE.test(url || "") || DATA_IMG_RE.test(url || "");
const toAbsolute = (url) => {
  if (!url || typeof url !== "string") return url || "";
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url;
  try {
    const origin = (typeof window !== "undefined" && window.location && window.location.origin) || "";
    if (!origin) return url;
    return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
  } catch {
    return url;
  }
};
const handlePrint = (url, e) => {
  if (e && e.stopPropagation) e.stopPropagation();
  const u = toAbsolute(url);
  const w = window.open(u, "_blank", "noopener,noreferrer");
  if (!w) return;
  setTimeout(() => {
    try {
      w.focus();
      if (typeof w.print === "function") w.print();
    } catch {
      /* cross-origin or not loaded — user prints manually */
    }
  }, 1200);
};

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
  const absUrl = toAbsolute(url);
  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <h4
          className={`text-xs font-black uppercase tracking-[0.2em] text-lux-ink flex items-center gap-3`}
        >
          <span
            className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}
          />
          {label}
        </h4>
        <div className="flex items-center gap-2">
          {isPdfUrl(absUrl) && (
            <button
              type="button"
              onClick={(e) => handlePrint(absUrl, e)}
              className="text-[9px] font-black text-lux-emerald uppercase tracking-widest px-2 py-0.5 rounded bg-lux-ivory hover:text-lux-deep hover:bg-white transition inline-flex items-center gap-1"
              title="Print PDF"
            >
              <FaPrint size={10} /> Print
            </button>
          )}
          <a
            href={absUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black text-lux-muted uppercase tracking-widest px-2 py-0.5 rounded bg-lux-ivory hover:text-lux-emerald hover:bg-white transition"
          >
            Open
          </a>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#ece4d2] shadow-sm group-hover:shadow-xl transition-all duration-500 bg-lux-ivory flex items-center justify-center min-h-[260px]">
        {isPdfUrl(absUrl) ? (
          <a
            href={absUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
              <FaFileAlt size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-lux-ink uppercase tracking-tight mb-1">
                View PDF Document
              </p>
              <p className="text-[10px] font-bold text-lux-muted uppercase tracking-widest">
                Opens in new tab
              </p>
            </div>
          </a>
        ) : isImageUrl(absUrl) ? (
          <a
            href={absUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={absUrl}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </a>
        ) : (
          <a
            href={absUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
              <FaFileAlt size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-lux-ink uppercase tracking-tight mb-1">
                View Document
              </p>
              <p className="text-[10px] font-bold text-lux-muted uppercase tracking-widest">
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
    { key: "qualityReport", label: "Quality Report", color: "violet" },
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
      label: "Document Attachment",
      url: entry.documentUrl,
      color: "purple",
    });
  }

  if (attachments.length === 0) return null;

  return (
    <div className="border-t border-[#ece4d2] pt-6 mt-6">
      <h3 className="font-serif text-sm font-semibold text-lux-muted uppercase tracking-widest mb-5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-lux-gold animate-pulse" />
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
          <h4 className="font-serif text-sm font-semibold text-lux-muted uppercase tracking-wider border-b border-[#ece4d2] pb-1">
            Basic Info
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-lux-muted">Loading Date:</span>
            <span className="font-semibold text-lux-ink">
              {formatDate(selectedEntry.loadingDate)}
            </span>
            <span className="text-lux-muted">Sauda No:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.saudaNo}
            </span>
            <span className="text-lux-muted">Seller:</span>
            <span className="font-semibold text-lux-ink">
              {sellerMap[selectedEntry.supplier] || "N/A"}
            </span>
            <span className="text-lux-muted">Payment Terms:</span>
            <span className="font-semibold text-lux-ink">
              {paymentTermsMap[selectedEntry.saudaNo] || "N/A"}
            </span>
            <span className="text-lux-muted">Commodity:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.commodity || "N/A"}
            </span>
            <span className="text-lux-muted">Due Date:</span>
            <span className="font-semibold text-lux-ink">
              {formatDate(selectedEntry.dueDate)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-sm font-semibold text-lux-muted uppercase tracking-wider border-b border-[#ece4d2] pb-1">
            Transport Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-lux-muted">Lorry No:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.lorryNumber}
            </span>
            <span className="text-lux-muted">Transporter:</span>
            <span className="font-semibold text-lux-ink">
              {transporterMap[selectedEntry.transporterId] ||
                selectedEntry.addedTransport ||
                "N/A"}
            </span>
            <span className="text-lux-muted">Driver Name:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.driverName || "N/A"}
            </span>
            <span className="text-lux-muted">Driver Phone:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.driverPhoneNumber || "N/A"}
            </span>
            <span className="text-lux-muted">Loading From:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.loadingFrom || "N/A"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-sm font-semibold text-lux-muted uppercase tracking-wider border-b border-[#ece4d2] pb-1">
            Weight & Billing
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-lux-muted">Loading Wt:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.loadingWeight} Tons
            </span>
            <span className="text-lux-muted">Unloading Wt:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.unloadingWeight || 0} Tons
            </span>
            <span className="text-lux-muted">Bags:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.bags || "N/A"}
            </span>
            <span className="text-lux-muted">Bill No:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.billNumber || "N/A"}
            </span>
            <span className="text-lux-muted">Seller Bill No:</span>
            <span className="font-semibold text-lux-ink">
              {selectedEntry.sellerBillNo || "N/A"}
            </span>
            <span className="text-lux-muted">Bill Date:</span>
            <span className="font-semibold text-lux-ink">
              {formatDate(selectedEntry.dateOfIssue)}
            </span>
            <span className="text-lux-muted">Entered By:</span>
            <span className="font-semibold text-lux-ink flex flex-col">
              <span>{selectedEntry.creatorMobile || "N/A"}</span>
              <span className="text-[10px] text-lux-muted uppercase">
                ({selectedEntry.entryByRole || "Admin"})
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-sm font-semibold text-lux-muted uppercase tracking-wider border-b border-[#ece4d2] pb-1">
            Financial Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm p-3 bg-lux-ivory rounded-xl border border-[#ece4d2]">
            <span className="text-lux-muted">Freight Rate:</span>
            <span className="font-bold text-lux-ink">
              ₹ {selectedEntry.freightRate}
            </span>
            <span className="text-lux-muted">Total Freight:</span>
            <span className="font-bold text-lux-ink">
              ₹ {selectedEntry.totalFreight}
            </span>
            <span className="text-lux-muted">Advance:</span>
            <span className="font-bold text-lux-emerald">
              ₹ {selectedEntry.advance}
            </span>
            <span className="text-lux-muted">Balance Due:</span>
            <span className="font-bold text-lux-emerald">
              ₹ {selectedEntry.balance}
            </span>
            <span className="text-lux-muted">Buyer Brokerage:</span>
            <span className="font-bold text-lux-ink">
              ₹ {selectedEntry.buyerBrokerage || 0}
            </span>
            <span className="text-lux-muted">Seller Brokerage:</span>
            <span className="font-bold text-lux-ink">
              ₹ {selectedEntry.sellerBrokerage || 0}
            </span>
            {selectedEntry.isRejected && (
              <>
                <span className="text-lux-muted col-span-1">Status:</span>
                <span className="font-bold text-rose-700 bg-rose-100 rounded px-2 py-0.5 inline-block text-right">
                  REJECTED
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <DocumentsSection entry={selectedEntry} />

      <div className="flex justify-end pt-4 border-t border-[#ece4d2]">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft font-bold ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewLoadingEntryPopup;
