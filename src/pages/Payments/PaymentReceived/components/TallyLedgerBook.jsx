import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const TallyLedgerBook = ({
  rows = [],
  loading = false,
  emptyMessage = "No ledger entries for this company mapping.",
  showCompanyColumns = true,
  footer,
}) => {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Loading ledger...
        </p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="py-20 px-6 text-center">
        <p className="text-sm font-bold text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-300 bg-[#fffef8] shadow-inner">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[88px]">
              Date
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] min-w-[200px]">
              Particulars
            </th>
            {showCompanyColumns && (
              <>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[120px]">
                  Buyer Co.
                </th>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[120px]">
                  Seller Co.
                </th>
              </>
            )}
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[72px]">
              Vch
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Debit
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Credit
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-[110px] text-right">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id || idx}
              className={[
                "border-b border-slate-200 text-[11px]",
                row.isOpening ? "bg-amber-50/80 font-bold" : "hover:bg-sky-50/50",
                idx % 2 === 0 && !row.isOpening ? "bg-white" : "",
                idx % 2 === 1 && !row.isOpening ? "bg-slate-50/40" : "",
              ].join(" ")}
            >
              <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                {row.date
                  ? new Date(row.date).toLocaleDateString("en-GB")
                  : "—"}
              </td>
              <td className="px-3 py-2 text-slate-800 border-r border-slate-200 leading-snug max-w-md">
                <span className="font-semibold uppercase text-[10px]">
                  {row.particulars}
                </span>
              </td>
              {showCompanyColumns && (
                <>
                  <td className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase border-r border-slate-200 truncate max-w-[120px]">
                    {row.buyerCompany || "—"}
                  </td>
                  <td className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase border-r border-slate-200 truncate max-w-[120px]">
                    {row.supplierCompany || "—"}
                  </td>
                </>
              )}
              <td className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase border-r border-slate-200">
                {row.vchType}
              </td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
                {row.debit > 0 ? formatLedgerAmount(row.debit) : ""}
              </td>
              <td className="px-3 py-2 text-right font-bold text-emerald-800 border-r border-slate-200 tabular-nums">
                {row.credit > 0 ? formatLedgerAmount(row.credit) : ""}
              </td>
              <td className="px-3 py-2 text-right font-black text-[#1e3a5f] tabular-nums">
                {formatLedgerAmount(row.balance)}
              </td>
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="bg-slate-900 text-white">
              {footer}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default TallyLedgerBook;
