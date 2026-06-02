import { FaCoins, FaMinus } from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const CreditBalancePanel = ({
  debitEntryTotal = 0,
  creditToSeller = 0,
  creditPostedToSeller = 0,
  creditPendingInForm = 0,
  debitBalanceRemaining = 0,
  creditByPair = [],
  fullCompanyMapping = false,
  buyerCompany = "",
  supplierCompany = "",
  allocationSource = "fresh",
  onSelectCreditPair,
}) => {
  const showSummary = debitEntryTotal > 0 || creditToSeller > 0;
  const hasPairTable = creditByPair.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#1e3a5f] text-white flex items-center justify-center shadow-md">
          <FaCoins size={14} />
        </div>
        <p className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-[0.25em]">
          Buyer → seller · entry total (Dr. − Cr.)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-[9px] font-black text-rose-800 uppercase tracking-widest">
            Debit balance (Advance) · Dr.
          </p>
          <p className="text-lg font-black text-rose-900 tabular-nums mt-1">
            {formatLedgerAmount(debitEntryTotal)}
          </p>
          <p className="text-[9px] font-bold text-rose-600/90 mt-1 normal-case">
            {allocationSource === "advance"
              ? "Total from buyer (entry / advance)"
              : "Entry amount from buyer"}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">
            Credit amount · Cr.
          </p>
          <p className="text-lg font-black text-emerald-900 tabular-nums mt-1">
            {formatLedgerAmount(creditToSeller)}
          </p>
          <p className="text-[9px] font-bold text-emerald-600/90 mt-1 normal-case">
            To seller
            {creditPendingInForm > 0
              ? ` · ${formatLedgerAmount(creditPostedToSeller)} saved + ${formatLedgerAmount(creditPendingInForm)} in table`
              : fullCompanyMapping && supplierCompany
                ? ` · ${supplierCompany} lorries`
                : ""}
          </p>
        </div>

        <div className="rounded-lg border border-[#1e3a5f]/25 bg-[#eef4ff] px-4 py-3 relative">
          <FaMinus
            className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 text-slate-300"
            size={10}
          />
          <p className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-widest">
            Balance (Dr. − Cr.)
          </p>
          <p className="text-lg font-black text-[#1e3a5f] tabular-nums mt-1">
            {formatLedgerAmount(debitBalanceRemaining)}
          </p>
          <p className="text-[9px] font-bold text-slate-500 mt-1 normal-case">
            Remaining from buyer entry
          </p>
        </div>
      </div>

      {!showSummary && (
        <p className="text-[11px] font-bold text-slate-500">
          Enter payment or record buyer advance (Dr.), then post Cr. per lorry —
          balance = Dr. − Cr.
        </p>
      )}

      {showSummary && fullCompanyMapping && supplierCompany && (
        <p className="text-[10px] font-bold text-slate-500 mb-2">
          {buyerCompany} → {supplierCompany}:{" "}
          {formatLedgerAmount(debitEntryTotal)} Dr. −{" "}
          {formatLedgerAmount(creditToSeller)} Cr. ={" "}
          {formatLedgerAmount(debitBalanceRemaining)} left
        </p>
      )}

      {hasPairTable && (
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
            Dr. advance by buyer → seller · click row
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-100 bg-white/90">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-rose-50 border-b border-rose-100">
                <tr>
                  <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500">
                    Buyer
                  </th>
                  <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500">
                    Seller
                  </th>
                  <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500 text-right">
                    Dr. left
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditByPair.map((row, idx) => (
                  <tr
                    key={`${row.buyerCompany}-${row.supplierCompany}-${idx}`}
                    className={`border-b border-slate-50 last:border-0 ${
                      onSelectCreditPair
                        ? "cursor-pointer hover:bg-rose-50/80"
                        : ""
                    } ${
                      fullCompanyMapping &&
                      row.supplierCompany === supplierCompany
                        ? "bg-rose-50"
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
                    <td className="px-3 py-2 font-bold text-slate-800 uppercase truncate max-w-[120px]">
                      {row.buyerCompany}
                    </td>
                    <td className="px-3 py-2 font-bold text-amber-800 uppercase truncate max-w-[120px]">
                      {row.supplierCompany}
                    </td>
                    <td className="px-3 py-2 font-black text-rose-700 text-right tabular-nums">
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
