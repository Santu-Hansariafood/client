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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
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
        <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-6 bg-white/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {mappingActive && buyerCompany && supplierCompany
                ? "Credit balance (Cr.)"
                : isAdvance
                  ? "Advance · Cr."
                  : "Payment Received (Cr.)"}
            </span>
            <span className="text-xl font-black text-emerald-700 tabular-nums tracking-tight">
              {formatLedgerAmount(creditEntryTotal)}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              Lorry Bill (Dr.)
            </span>
            <span className="text-xl font-black text-rose-700 tabular-nums tracking-tight">
              {formatLedgerAmount(debitToSeller)}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex flex-col gap-1 min-w-[150px] bg-[#1e3a5f] p-3 rounded-xl shadow-lg shadow-blue-100">
            <span className="text-[9px] font-black text-blue-200 uppercase tracking-widest">
              {isAdvance ? "Cr. Balance Left" : "Net Cr. Remaining"}
            </span>
            <span className="text-xl font-black text-white tabular-nums tracking-tight">
              {formatLedgerAmount(creditBalanceRemaining)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLedgerBanner;
