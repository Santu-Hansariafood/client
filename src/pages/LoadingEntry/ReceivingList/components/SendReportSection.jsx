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
    <div className="lux-card lux-gold-top p-5 sm:p-6">
      <h4 className="mb-4 flex items-center gap-3 font-serif text-lg font-semibold text-lux-ink">
        <span className="w-2 h-2 rounded-full bg-lux-gold" />
        Send Report to Seller
      </h4>
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <select
          value={selectedSellerEmail}
          onChange={(e) => setSelectedSellerEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-medium text-lux-ink shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-lux-gold/40"
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
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-3 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
        >
          <FaEnvelope size={18} />
          {sendingEmail ? "Sending..." : "Send Report"}
        </button>
      </div>
    </div>
  );
};

export default SendReportSection;
