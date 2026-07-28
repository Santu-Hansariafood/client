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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {filteredDocs.map((doc) => (
        <div key={doc.key} className="space-y-4 group">
          <div className="flex items-center justify-between">
            <h4
              className={`text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3`}
            >
              <span
                className={`w-2 h-2 rounded-full bg-${doc.color}-500 animate-pulse`}
              />
              {doc.label}
            </h4>
            <div className="flex items-center gap-2">
              {isPdfUrl(doc.url) && (
                <button
                  type="button"
                  onClick={(e) => handlePrint(doc.url, e)}
                  className="text-[9px] font-black text-sky-600 uppercase tracking-widest px-2 py-0.5 rounded bg-sky-50 hover:text-sky-700 hover:bg-sky-100 transition inline-flex items-center gap-1"
                  title="Print PDF"
                >
                  <FaPrint size={10} /> Print
                </button>
              )}
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50 hover:text-emerald-600 hover:bg-emerald-50 transition"
              >
                Open
              </a>
            </div>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-50 flex items-center justify-center min-h-[300px]">
            {isPdfUrl(doc.url) ? (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex flex-col items-center gap-4 p-10 text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                  <FaFileAlt size={32} />
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
                <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                  <FaFileAlt size={32} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">
                    Open Document
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
