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
    <div className="lux-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[#ece4d2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-lux-ivory to-lux-cream">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 w-10 h-10 rounded-xl border border-[#e4dbc6] bg-lux-cream flex items-center justify-center text-lux-emerald hover:bg-lux-ivory"
            title="Back to voucher register"
          >
            <FaArrowLeft size={12} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FaTruck className="text-lux-emerald shrink-0" />
              <h4 className="font-serif font-semibold text-lux-ink truncate">
                Lorry-wise · Sauda {saudaLabel}
              </h4>
            </div>
            <p className="lux-eyebrow mt-0.5 truncate">
              {buyerCompany} → {supplierCompany}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left bg-lux-cream">
          <thead>
            <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-gold-soft font-serif">
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-lux-emerald/40 w-12">
                #
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-lux-emerald/40">
                Lorry / Bill
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-lux-emerald/40 text-right w-28">
                Debit (Freight)
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-lux-emerald/40 text-center min-w-[140px]">
                Voucher / Date
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-lux-emerald/40 text-right w-28">
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
                className={`border-b border-[#ece4d2] text-[11px] ${idx % 2 === 0 ? "bg-lux-cream" : "bg-[#f2eee2]/50"} hover:bg-lux-ivory`}
              >
                <td className="px-3 py-2.5 font-bold text-lux-muted border-r border-[#ece4d2]">
                  {idx + 1}
                </td>
                <td className="px-3 py-2.5 border-r border-[#ece4d2]">
                  <span className="font-black text-lux-ink uppercase">
                    {lorry.lorryNumber}
                  </span>
                  <span className="block text-[9px] text-lux-muted font-bold mt-0.5">
                    Bill: {lorry.billNumber || "NIL"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums border-r border-[#ece4d2]">
                  {formatLedgerAmount(lorry.totalFreight)}
                </td>
                <td className="px-3 py-2.5 border-r border-[#ece4d2]">
                  {lorry.adjustments?.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {lorry.adjustments.map((adj, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-2 text-[9px] bg-lux-cream rounded px-2 py-1 border border-[#ece4d2]"
                        >
                          <span className="text-lux-muted">
                            {formatDate(adj.paymentDate)}
                          </span>
                          <span className="font-black text-lux-ink">
                            {adj.voucherNo || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] font-black text-lux-gold-soft uppercase italic">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-800 tabular-nums border-r border-[#ece4d2]">
                  {formatLedgerAmount(lorry.totalAdjusted)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-black tabular-nums ${lorry.balance > 0 ? "text-rose-700" : "text-lux-muted"}`}
                >
                  {formatLedgerAmount(lorry.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-gold-soft text-[11px] font-black font-serif">
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
