import { FaCoins } from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const CreditBalancePanel = ({
  totalAdvanceBalance = 0,
  advanceBalance = 0,
  creditByPair = [],
  fullCompanyMapping = false,
  buyerCompany = "",
  supplierCompany = "",
  onSelectCreditPair,
}) => {
  const hasDebit = totalAdvanceBalance > 0 || creditByPair.length > 0;
  const pairDebit =
    fullCompanyMapping && supplierCompany ? advanceBalance : null;

  return (
    <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50/80 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-700 text-white flex items-center justify-center shadow-md">
            <FaCoins size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black text-rose-800 uppercase tracking-[0.25em]">
              Debit balance (Advance) · Dr.
            </p>
            <p className="text-xl font-black text-rose-900 tabular-nums">
              {hasDebit
                ? formatLedgerAmount(
                    pairDebit != null ? pairDebit : totalAdvanceBalance,
                  )
                : formatLedgerAmount(0)}
            </p>
            <p className="text-[10px] font-bold text-rose-600/80 mt-0.5">
              {fullCompanyMapping && supplierCompany
                ? `From ${buyerCompany} (buyer) · spend lorry-wise on ${supplierCompany} (seller) — post Cr. below`
                : buyerCompany
                  ? `Advance received from ${buyerCompany} — select seller, then allocate per lorry`
                  : "Buyer advance on account (Dr.) — mapped buyer → seller"}
            </p>
          </div>
        </div>
        {fullCompanyMapping && supplierCompany && (
          <div className="px-3 py-2 rounded-lg bg-amber-500 text-white shadow-sm text-right">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-90">
              Seller
            </p>
            <p className="text-xs font-black uppercase truncate max-w-[160px]">
              {supplierCompany}
            </p>
          </div>
        )}
      </div>

      {!hasDebit && (
        <p className="text-[11px] font-bold text-slate-500">
          No buyer advance (Dr.) on account. Record advance with buyer + seller,
          then post Cr. against that seller&apos;s lorries in the table.
        </p>
      )}

      {hasDebit && !fullCompanyMapping && (
        <p className="text-[11px] font-bold text-rose-700 mb-2">
          Pick seller for this buyer, switch to{" "}
          <span className="uppercase">From Advance</span>, then enter Cr. per
          lorry (uses buyer Dr. for that seller only).
        </p>
      )}

      {creditByPair.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
            Buyer → seller · Dr. advance · click row to load lorries
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
                    Dr.
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
