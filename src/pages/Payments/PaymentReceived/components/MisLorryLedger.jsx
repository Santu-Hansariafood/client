import { FaTruck, FaArrowLeft } from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MisLorryLedger = ({
  saudaLabel,
  lorryWiseData,
  onBack,
  buyerCompany,
  supplierCompany,
}) => {
  const totalFreight = lorryWiseData.reduce(
    (s, l) => s + (Number(l.totalFreight) || 0),
    0,
  );
  const totalPaid = lorryWiseData.reduce(
    (s, l) => s + (Number(l.totalAdjusted) || 0),
    0,
  );
  const totalDue = lorryWiseData.reduce(
    (s, l) => s + (Number(l.balance) || 0),
    0,
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/80 to-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50"
            title="Back to voucher register"
          >
            <FaArrowLeft size={12} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FaTruck className="text-amber-600 shrink-0" />
              <h4 className="font-black text-slate-900 truncate">
                Lorry-wise · Sauda {saudaLabel}
              </h4>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              {buyerCompany} → {supplierCompany}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left bg-[#fffef8]">
          <thead>
            <tr className="bg-[#1e3a5f] text-white">
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-12">
                #
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f]">
                Lorry / Bill
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] text-right w-28">
                Debit (Freight)
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] text-center min-w-[140px]">
                Voucher / Date
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] text-right w-28">
                Credit (Paid)
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-right w-28">
                Balance (Due)
              </th>
            </tr>
          </thead>
          <tbody>
            {lorryWiseData.map((lorry, idx) => (
              <tr
                key={lorry._id}
                className={`border-b border-slate-200 text-[11px] ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-sky-50/40`}
              >
                <td className="px-3 py-2.5 font-bold text-slate-500 border-r border-slate-200">
                  {idx + 1}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-200">
                  <span className="font-black text-slate-900 uppercase">
                    {lorry.lorryNumber}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-bold mt-0.5">
                    Bill: {lorry.billNumber || "NIL"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums border-r border-slate-200">
                  {formatLedgerAmount(lorry.totalFreight)}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-200">
                  {lorry.adjustments?.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {lorry.adjustments.map((adj, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-2 text-[9px] bg-white rounded px-2 py-1 border border-slate-100"
                        >
                          <span className="text-slate-600">
                            {formatDate(adj.paymentDate)}
                          </span>
                          <span className="font-black text-slate-800">
                            {adj.voucherNo || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] font-black text-slate-300 uppercase italic">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-800 tabular-nums border-r border-slate-200">
                  {formatLedgerAmount(lorry.totalAdjusted)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-black tabular-nums ${lorry.balance > 0 ? "text-rose-700" : "text-slate-400"}`}
                >
                  {formatLedgerAmount(lorry.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white text-[11px] font-black">
              <td colSpan={2} className="px-3 py-3 uppercase tracking-widest">
                Total
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {formatLedgerAmount(totalFreight)}
              </td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3 text-right tabular-nums text-emerald-300">
                {formatLedgerAmount(totalPaid)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-rose-300">
                {formatLedgerAmount(totalDue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MisLorryLedger;
