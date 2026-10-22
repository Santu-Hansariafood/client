import React from "react";
import {
  formatLedgerAmount,
  buildPaymentParticulars,
} from "../utils/paymentLedgerUtils";
import Loading from "../../../../common/Loading/Loading";

const SimplePaymentList = ({
  payments = [],
  loading = false,
  emptyMessage = "No payments recorded for this period.",
}) => {
  if (loading) {
    return <Loading />;
  }

  if (!payments.length) {
    return (
      <div className="py-20 px-6 text-center">
        <p className="font-serif text-sm font-semibold text-lux-muted">{emptyMessage}</p>
      </div>
    );
  }

  const totalAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  const totalClaim = payments.reduce((sum, p) => sum + Number(p.claim || 0), 0);
  const totalTds = payments.reduce((sum, p) => sum + Number(p.tds || 0), 0);
  const grandTotal = totalAmount + totalClaim + totalTds;

  return (
    <div className="space-y-4">
      {/* Total Payment Received Summary at the top of the list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-cream p-4 sm:p-6 rounded-3xl shadow-lg">
        <div>
          <p className="lux-eyebrow text-lux-gold-soft/70 mb-1">
            Total Received (Net)
          </p>
          <p className="font-serif text-2xl font-semibold tabular-nums">
            {formatLedgerAmount(totalAmount)}
          </p>
        </div>
        <div>
          <p className="lux-eyebrow text-rose-400 mb-1">
            Total Claim
          </p>
          <p className="font-serif text-2xl font-semibold tabular-nums">
            {formatLedgerAmount(totalClaim)}
          </p>
        </div>
        <div>
          <p className="lux-eyebrow text-emerald-400 mb-1">
            Total TDS
          </p>
          <p className="font-serif text-2xl font-semibold tabular-nums">
            {formatLedgerAmount(totalTds)}
          </p>
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-4">
          <p className="lux-eyebrow text-lux-gold-soft mb-1">
            Grand Total (Gross)
          </p>
          <p className="font-serif text-2xl font-semibold tabular-nums text-lux-gold-soft">
            {formatLedgerAmount(grandTotal)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#ece4d2] rounded-2xl bg-lux-cream shadow-sm">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-gold-soft font-serif border-b border-[#ece4d2]">
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Seller
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Claim
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                TDS
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Mode
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">
                Narration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece4d2]">
            {payments.map((payment, idx) => (
              <tr
                key={payment._id || idx}
                className="odd:bg-lux-cream even:bg-[#f2eee2]/50 hover:bg-lux-ivory transition-colors"
              >
                <td className="px-4 py-4 text-[11px] font-bold text-lux-ink">
                  {new Date(payment.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-4 text-[10px] font-bold text-blue-600 uppercase">
                  {payment.buyerCompany || "—"}
                </td>
                <td className="px-4 py-4 text-[10px] font-bold text-lux-emerald uppercase">
                  {payment.supplierCompany || "—"}
                </td>
                <td className="px-4 py-4 text-[11px] font-black text-emerald-700 tabular-nums">
                  {formatLedgerAmount(payment.amount)}
                </td>
                <td className="px-4 py-4 text-[11px] font-black text-rose-600 tabular-nums">
                  {payment.claim > 0 ? formatLedgerAmount(payment.claim) : "—"}
                </td>
                <td className="px-4 py-4 text-[11px] font-black text-lux-emerald tabular-nums">
                  {payment.tds > 0 ? formatLedgerAmount(payment.tds) : "—"}
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 rounded-lg bg-lux-ivory text-lux-muted text-[9px] font-black uppercase tracking-tighter">
                    {payment.paymentMode}
                  </span>
                </td>
                <td
                  className="px-4 py-4 text-[11px] text-lux-muted font-medium max-w-xs truncate"
                  title={buildPaymentParticulars(payment)}
                >
                  {buildPaymentParticulars(payment) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimplePaymentList;
