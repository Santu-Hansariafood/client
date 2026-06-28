import React from "react";
import { FaFileAlt } from "react-icons/fa";

const DocumentsDisplay = ({ documents, documentUrl }) => {
  const docTypes = [
    { key: "kantaSlip", label: "Kanta Slip", color: "blue" },
    { key: "unloadingChallan", label: "Unloading Challan", color: "indigo" },
    { key: "partyBillCopy", label: "Party Bill Copy", color: "emerald" },
  ];

  const filteredDocs = docTypes
    .map((docType) => {
      const url = documents?.[docType.key];
      return url ? { ...docType, url } : null;
    })
    .filter(Boolean);

  if (documentUrl && typeof documentUrl === "string" && documentUrl.trim()) {
    filteredDocs.push({ key: "attachment", label: "Attachment", url: documentUrl, color: "purple" });
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
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50">
              Verified
            </span>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-50 flex items-center justify-center min-h-[300px]">
            {doc.url.endsWith(".pdf") ? (
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
            ) : (
              <img
                src={doc.url}
                alt={doc.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentsDisplay;
