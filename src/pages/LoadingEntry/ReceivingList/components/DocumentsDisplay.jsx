import React from "react";
import { FaFileAlt, FaPrint } from "react-icons/fa";

const PDF_RE = /\.pdf(\?.*)?(#.*)?$/i;
const DATA_PDF_RE = /^data:application\/pdf/i;
const IMG_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?(#.*)?$/i;
const isPdfUrl = (url) => PDF_RE.test(url || "") || DATA_PDF_RE.test(url || "");
const isImageUrl = (url) => IMG_RE.test(url || "") || /^data:image\//i.test(url || "");
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
      /* cross-origin or not loaded — user will print manually */
    }
  }, 1200);
};

const DocumentsDisplay = ({ documents, documentUrl }) => {
  const docTypes = [
    { key: "kantaSlip", label: "Kanta Slip", color: "blue" },
    { key: "unloadingChallan", label: "Unloading Challan", color: "indigo" },
    { key: "partyBillCopy", label: "Party Bill Copy", color: "emerald" },
    { key: "qualityReport", label: "Quality Report", color: "violet" },
  ];

  const filteredDocs = docTypes
    .map((docType) => {
      const raw = documents?.[docType.key];
      const url = raw && typeof raw === "string" && raw.trim();
      return url ? { ...docType, url: toAbsolute(url) } : null;
    })
    .filter(Boolean);

  if (documentUrl && typeof documentUrl === "string" && documentUrl.trim()) {
    filteredDocs.push({
      key: "attachment",
      label: "Document Attachment",
      url: toAbsolute(documentUrl),
      color: "purple",
    });
  }

  if (filteredDocs.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {filteredDocs.map((doc) => (
        <div key={doc.key} className="group space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`flex items-center gap-3 font-serif text-sm font-semibold text-lux-ink`}
            >
              <span
                className={`w-2 h-2 rounded-full bg-${doc.color}-500 animate-pulse`}
              />
              {doc.label}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {isPdfUrl(doc.url) && (
                <button
                  type="button"
                  onClick={(e) => handlePrint(doc.url, e)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#e6dcc4] bg-lux-cream px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-lux-emerald transition hover:-translate-y-0.5 hover:bg-white"
                  title="Print PDF"
                >
                  <FaPrint size={10} /> Print
                </button>
              )}
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-[#e6dcc4] bg-[#f2eee2] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-lux-muted transition hover:-translate-y-0.5 hover:text-lux-emerald"
              >
                Open
              </a>
            </div>
          </div>

          <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-[#ece4d2] bg-lux-ivory transition-all duration-500 group-hover:shadow-xl sm:min-h-[300px]">
            {isPdfUrl(doc.url) ? (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex flex-col items-center gap-4 p-10 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-lg transition-transform group-hover/btn:scale-110">
                  <FaFileAlt size={32} />
                </div>
                <div>
                  <p className="mb-1 font-serif text-sm font-bold uppercase tracking-tight text-lux-ink">
                    View PDF Document
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-lux-muted">
                    Opens in new tab
                  </p>
                </div>
              </a>
            ) : isImageUrl(doc.url) ? (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={doc.url}
                  alt={doc.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </a>
            ) : (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex flex-col items-center gap-4 p-10 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2eee2] text-lux-muted shadow-lg transition-transform group-hover/btn:scale-110">
                  <FaFileAlt size={32} />
                </div>
                <div>
                  <p className="mb-1 font-serif text-sm font-bold uppercase tracking-tight text-lux-ink">
                    Open Document
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-lux-muted">
                    Click to open in new tab
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentsDisplay;
