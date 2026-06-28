import React from "react";
import { FaEnvelope } from "react-icons/fa";

const SendReportSection = ({
  sellerCompanies,
  selectedEntry,
  selectedSellerEmail,
  setSelectedSellerEmail,
  onSendEmail,
  sendingEmail,
}) => {
  const matchingSellers = sellerCompanies.filter(
    (sc) =>
      selectedEntry?.supplierCompany?.toLowerCase() ===
      sc.companyName?.toLowerCase()
  );

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
      <h4 className="text-base font-black text-emerald-900 mb-4 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Send Report to Seller
      </h4>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <select
          value={selectedSellerEmail}
          onChange={(e) => setSelectedSellerEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-emerald-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent font-medium"
        >
          <option value="">Select Seller Email</option>
          {(matchingSellers.length > 0 ? matchingSellers : sellerCompanies).map((sc) => (
            <option key={sc._id} value={sc.email}>
              {sc.companyName} - {sc.email}
            </option>
          ))}
        </select>
        <button
          onClick={onSendEmail}
          disabled={!selectedSellerEmail || sendingEmail}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
        >
          <FaEnvelope size={18} />
          {sendingEmail ? "Sending..." : "Send Report"}
        </button>
      </div>
    </div>
  );
};

export default SendReportSection;
