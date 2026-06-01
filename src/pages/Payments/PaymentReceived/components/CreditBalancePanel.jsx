import { FaCoins } from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const CreditBalancePanel = ({
  totalAdvanceBalance = 0,
  advanceBalance = 0,
  creditByPair = [],
  fullCompanyMapping = false,
  buyerCompany = "",
}) => {
  const hasCredit = totalAdvanceBalance > 0 || creditByPair.length > 0;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50/80 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <FaCoins size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black text-blue-800 uppercase tracking-[0.25em]">
              Credit balance (Advance)
            </p>
            <p className="text-xl font-black text-blue-900 tabular-nums">
              {hasCredit
                ? formatLedgerAmount(totalAdvanceBalance)
                : formatLedgerAmount(0)}
            </p>
            <p className="text-[10px] font-bold text-blue-600/80 mt-0.5">
              {buyerCompany
                ? `All unadjusted credit for ${buyerCompany}`
                : "Total unadjusted credit on ledger"}
            </p>
          </div>
        </div>
        {fullCompanyMapping && advanceBalance !== totalAdvanceBalance && (
          <div className="px-3 py-2 rounded-lg bg-white border border-blue-200 text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              This buyer → seller
            </p>
            <p className="text-sm font-black text-blue-700 tabular-nums">
              {formatLedgerAmount(advanceBalance)}
            </p>
          </div>
        )}
      </div>

      {!hasCredit && (
        <p className="text-[11px] font-bold text-slate-500">
          No unadjusted advance credit for this scope. Record an advance with buyer
          and seller to create company-to-company credit.
        </p>
      )}

      {creditByPair.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
            Company-to-company credit
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-blue-100 bg-white/90">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500">
                    Buyer
                  </th>
                  <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500">
                    Seller
                  </th>
                  <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500 text-right">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditByPair.map((row, idx) => (
                  <tr
                    key={`${row.buyerCompany}-${row.supplierCompany}-${idx}`}
                    className="border-b border-slate-50 last:border-0 hover:bg-blue-50/50"
                  >
                    <td className="px-3 py-2 font-bold text-slate-800 uppercase truncate max-w-[120px]">
                      {row.buyerCompany}
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-700 uppercase truncate max-w-[120px]">
                      {row.supplierCompany}
                    </td>
                    <td className="px-3 py-2 font-black text-blue-700 text-right tabular-nums">
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
