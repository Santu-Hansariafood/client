import { FaArrowRight } from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const CompanyLedgerBanner = ({
  buyerCompany,
  supplierCompany,
  subtitle,
  mappingActive = false,
  buyerOnly = false,
  creditEntryTotal = 0,
  debitToSeller = 0,
  creditBalanceRemaining = 0,
  allocationSource = "fresh",
}) => {
  const isAdvance = allocationSource === "advance";
  const showTotals = mappingActive || buyerOnly;

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 shadow-sm ${
        mappingActive
          ? "border-[#1e3a5f]/40 bg-gradient-to-r from-[#eef4ff] via-white to-[#fff8ed] ring-2 ring-[#1e3a5f]/10"
          : "border-[#1e3a5f]/25 bg-gradient-to-r from-[#f8fafc] via-white to-[#f0f9ff]"
      }`}
    >
      <p className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-[0.25em] mb-2">
        Tally ledger · Company mapping
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
          <span className="text-[9px] font-black uppercase opacity-80">Buyer</span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[160px] sm:max-w-none">
            {buyerCompany}
          </span>
        </div>
        <FaArrowRight className="text-slate-400 shrink-0" size={12} />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white shadow-sm">
          <span className="text-[9px] font-black uppercase opacity-80">Seller</span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[160px] sm:max-w-none">
            {supplierCompany ||
              (buyerOnly ? "Select seller below" : "—")}
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {subtitle}
        </p>
      )}
      {showTotals && (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`inline-flex flex-col px-3 py-2 rounded-lg border min-w-[140px] ${
              isAdvance
                ? "bg-emerald-50 border-emerald-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <span
              className={`text-[9px] font-black uppercase tracking-widest ${
                isAdvance ? "text-emerald-800" : "text-emerald-800"
              }`}
            >
              {mappingActive && buyerCompany && supplierCompany
                ? "Credit balance (Cr.)"
                : isAdvance
                  ? "Advance · Cr."
                  : "Payment Received (Cr.)"}
            </span>
            <span
              className={`text-sm font-black tabular-nums ${
                isAdvance ? "text-emerald-700" : "text-emerald-700"
              }`}
            >
              {formatLedgerAmount(creditEntryTotal)}
            </span>
          </div>
          <span className="text-slate-400 font-black text-xs hidden sm:inline">
            −
          </span>
          <div className="inline-flex flex-col px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 min-w-[140px]">
            <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest">
              Lorry Bill (Dr.)
            </span>
            <span className="text-sm font-black text-rose-700 tabular-nums">
              {formatLedgerAmount(debitToSeller)}
            </span>
          </div>
          <span className="text-slate-400 font-black text-xs hidden sm:inline">
            =
          </span>
          <div className="inline-flex flex-col px-3 py-2 rounded-lg bg-[#eef4ff] border border-[#1e3a5f]/20 min-w-[140px]">
            <span className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-widest">
              {isAdvance ? "Cr. left" : "Cr. Remaining"}
            </span>
            <span className="text-sm font-black text-[#1e3a5f] tabular-nums">
              {formatLedgerAmount(creditBalanceRemaining)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLedgerBanner;
