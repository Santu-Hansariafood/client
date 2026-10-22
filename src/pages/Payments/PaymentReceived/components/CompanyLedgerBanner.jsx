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
      className={`rounded-2xl border px-4 py-3 shadow-sm sm:px-5 sm:py-4 ${
        mappingActive
          ? "border-lux-gold/40 bg-gradient-to-r from-lux-ivory via-lux-cream to-[#fff8ed] ring-2 ring-lux-gold/10"
          : "border-[#ece4d2] bg-lux-ivory"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-lux-emerald to-lux-deep px-3 py-1.5 text-lux-gold-soft shadow-sm ring-1 ring-lux-gold/30">
          <span className="text-[9px] font-black uppercase opacity-80">
            Buyer
          </span>
          <span className="truncate max-w-[160px] text-xs font-black uppercase tracking-tight sm:max-w-none sm:text-sm">
            {buyerCompany}
          </span>
        </div>
        <FaArrowRight className="shrink-0 text-lux-muted" size={12} />
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-emerald-700 shadow-sm">
          <span className="text-[9px] font-black uppercase opacity-80">
            Seller
          </span>
          <span className="truncate max-w-[160px] text-xs font-black uppercase tracking-tight sm:max-w-none sm:text-sm">
            {supplierCompany || (buyerOnly ? "Select seller below" : "—")}
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="lux-eyebrow mt-2 tracking-wide">
          {subtitle}
        </p>
      )}
      {showTotals && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 shadow-inner sm:gap-6">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="lux-eyebrow flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
              {mappingActive && buyerCompany && supplierCompany
                ? "Credit balance (Cr.)"
                : isAdvance
                  ? "Advance · Cr."
                  : "Payment Received (Cr.)"}
            </span>
            <span className="font-serif text-xl font-semibold text-lux-ink tabular-nums tracking-tight">
              {formatLedgerAmount(creditEntryTotal)}
            </span>
          </div>

          <div className="h-10 w-px bg-[#ece4d2] hidden md:block"></div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="lux-eyebrow flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
              Lorry Bill (Dr.)
            </span>
            <span className="font-serif text-xl font-semibold text-rose-700 tabular-nums tracking-tight">
              {formatLedgerAmount(debitToSeller)}
            </span>
          </div>

          <div className="h-10 w-px bg-[#ece4d2] hidden md:block"></div>

          <div className="flex min-w-[150px] flex-col gap-1 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep p-3 text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30">
            <span className="lux-eyebrow text-lux-gold-soft">
              {isAdvance ? "Cr. Balance Left" : "Net Cr. Remaining"}
            </span>
            <span className="font-serif text-xl font-semibold text-lux-gold-soft tabular-nums tracking-tight">
              {formatLedgerAmount(creditBalanceRemaining)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLedgerBanner;
