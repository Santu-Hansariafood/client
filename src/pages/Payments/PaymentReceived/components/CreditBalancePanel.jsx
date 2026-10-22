import { FaCoins, FaMinus } from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const CreditBalancePanel = ({
  creditEntryTotal = 0,
  debitToSeller = 0,
  debitPostedToSeller = 0,
  debitPendingInForm = 0,
  creditBalanceRemaining = 0,
  creditByPair = [],
  fullCompanyMapping = false,
  buyerCompany = "",
  supplierCompany = "",
  allocationSource = "fresh",
  onSelectCreditPair,
}) => {
  const isAdvance = allocationSource === "advance";
  const showSummary = creditEntryTotal > 0 || debitToSeller > 0;
  const showAdvanceTable = isAdvance && creditByPair.length > 0;

  const creditLabel =
    fullCompanyMapping && buyerCompany && supplierCompany
      ? "Total Credit (Cr.)"
      : isAdvance
        ? "Total Credit (Advance) · Cr."
        : "Total Credit Received (Cr.)";

  const creditHint =
    fullCompanyMapping && buyerCompany && supplierCompany
      ? `available payment from ${buyerCompany}`
      : isAdvance
        ? "Buyer advance on account (Cr.)"
        : "Amount received from buyer (entry above)";

  const debitLabel = isAdvance ? "Debit to seller · Dr." : "Lorry Bill (Dr.)";

  const debitHint = isAdvance
    ? "Posted to seller lorries"
    : "Total bill amount for seller lorries";

  const remainingLabel = isAdvance ? "Cr. balance left" : "Balance (Cr. left)";

  const headerTitle =
    fullCompanyMapping && buyerCompany && supplierCompany
      ? `Credit balance from ${buyerCompany} to ${supplierCompany}`
      : isAdvance
        ? "Buyer → seller · advance (Cr. − Dr.)"
        : "Buyer → seller · payment received (Cr.) & lorry adjustment (Dr.)";

  return (
    <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-md ring-1 ring-lux-gold/30">
          <FaCoins size={14} />
        </div>
        <p className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-lux-ink">
          {headerTitle}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3">
          <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest">
            {debitLabel}
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-rose-700 tabular-nums">
            {formatLedgerAmount(debitToSeller)}
          </p>
          <p className="mt-1 text-[9px] font-bold text-rose-700/90 normal-case">
            {debitHint}
            {isAdvance && debitPostedToSeller > 0
              ? ` · ${formatLedgerAmount(debitPostedToSeller)} saved`
              : ""}
            {!isAdvance && debitPendingInForm > 0
              ? ` · ${formatLedgerAmount(debitPendingInForm)} in table now`
              : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-3">
          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
            {creditLabel}
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-emerald-800 tabular-nums">
            {formatLedgerAmount(creditEntryTotal)}
          </p>
          <p className="mt-1 text-[9px] font-bold text-emerald-700/90 normal-case">
            {creditHint} · GST excluded
          </p>
        </div>

        <div className="relative rounded-2xl border border-lux-gold/40 bg-gradient-to-br from-lux-emerald to-lux-deep px-4 py-3 text-lux-gold-soft">
          <FaMinus
            className="absolute -left-3 top-1/2 hidden -translate-y-1/2 text-lux-muted sm:block"
            size={10}
          />
          <p className="lux-eyebrow text-lux-gold-soft">
            {remainingLabel}
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-lux-gold-soft tabular-nums">
            {formatLedgerAmount(Math.abs(creditEntryTotal - debitToSeller))}
          </p>
          <p className="mt-1 text-[9px] font-bold text-lux-gold-soft/80 normal-case">
            {isAdvance ? "Cr. − Dr." : "Difference (Credit − Debit)"}
          </p>
        </div>
      </div>

      {!showSummary && (
        <p className="text-[11px] font-bold text-lux-muted">
          {isAdvance
            ? "Record buyer advance (Cr.), then adjust Dr. per lorry."
            : ""}
        </p>
      )}

      {showSummary && fullCompanyMapping && supplierCompany && (
        <p className="mb-2 text-[10px] font-bold text-lux-muted">
          {buyerCompany} → {supplierCompany}:{" "}
          {formatLedgerAmount(creditEntryTotal)} Cr. −{" "}
          {formatLedgerAmount(debitToSeller)} Dr. ={" "}
          {formatLedgerAmount(Math.abs(creditEntryTotal - debitToSeller))}{" "}
          {isAdvance ? "Cr. left" : "Credit remaining"}
        </p>
      )}

      {showAdvanceTable && (
        <div>
          <p className="lux-eyebrow mb-2">
            Advance (Dr.) by buyer → seller · click row
          </p>
          <div className="max-h-40 overflow-y-auto rounded-2xl border border-[#ece4d2] bg-lux-cream">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-[#ece4d2] bg-lux-ivory">
                <tr>
                  <th className="px-3 py-2 text-[9px] font-black uppercase text-lux-muted">
                    Buyer
                  </th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase text-lux-muted">
                    Seller
                  </th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase text-lux-muted">
                    Advance left
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditByPair.map((row, idx) => (
                  <tr
                    key={`${row.buyerCompany}-${row.supplierCompany}-${idx}`}
                    className={`border-b border-[#ece4d2] last:border-0 ${
                      onSelectCreditPair
                        ? "cursor-pointer hover:bg-lux-ivory"
                        : ""
                    } ${
                      fullCompanyMapping &&
                      row.supplierCompany === supplierCompany
                        ? "bg-lux-ivory"
                        : ""
                    }`}
                    onClick={() => onSelectCreditPair?.(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onSelectCreditPair?.(row);
                      }
                    }}
                    tabIndex={onSelectCreditPair ? 0 : undefined}
                    role={onSelectCreditPair ? "button" : undefined}
                  >
                    <td className="max-w-[120px] truncate px-3 py-2 font-bold uppercase text-lux-ink">
                      {row.buyerCompany}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-bold uppercase text-lux-emerald">
                      {row.supplierCompany}
                    </td>
                    <td className="px-3 py-2 text-right font-black tabular-nums text-rose-700">
                      {formatLedgerAmount(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBalancePanel;
