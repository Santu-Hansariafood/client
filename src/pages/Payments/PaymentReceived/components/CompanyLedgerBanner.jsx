import { FaArrowRight } from "react-icons/fa";

const CompanyLedgerBanner = ({
  buyerCompany,
  supplierCompany,
  ledgerType = "Buyer",
  subtitle,
}) => {
  const hasMapping = Boolean(buyerCompany);

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[#1e3a5f]/25 bg-gradient-to-r from-[#f8fafc] via-white to-[#f0f9ff] px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
      <p className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-[0.25em] mb-2">
        Tally ledger · Company mapping
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
          <span className="text-[9px] font-black uppercase opacity-80">Buyer</span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[160px] sm:max-w-none">
            {buyerCompany || "Select buyer company"}
          </span>
        </div>
        <FaArrowRight className="text-slate-400 shrink-0" size={12} />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white shadow-sm">
          <span className="text-[9px] font-black uppercase opacity-80">Seller</span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[160px] sm:max-w-none">
            {supplierCompany || (ledgerType === "Buyer" ? "All sellers" : "Select seller company")}
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {subtitle}
        </p>
      )}
      {!hasMapping && (
        <p className="mt-2 text-[10px] font-bold text-amber-700">
          Select buyer company to open company-wise ledger
        </p>
      )}
    </div>
  );
};

export default CompanyLedgerBanner;
