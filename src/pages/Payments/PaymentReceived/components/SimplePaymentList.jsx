import React from "react";
import {
  formatLedgerAmount,
  buildPaymentParticulars,
} from "../utils/paymentLedgerUtils";

const SimplePaymentList = ({
  payments = [],
  loading = false,
  emptyMessage = "No payments recorded for this period.",
}) => {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Loading payments...
        </p>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="py-20 px-6 text-center">
        <p className="text-sm font-bold text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalClaim = payments.reduce((sum, p) => sum + Number(p.claim || 0), 0);
  const totalTds = payments.reduce((sum, p) => sum + Number(p.tds || 0), 0);
  const grandTotal = totalAmount + totalClaim + totalTds;

  return (
    <div className="space-y-4">
      {/* Total Payment Received Summary at the top of the list */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
            Total Received (Net)
          </p>
          <p className="text-2xl font-black tabular-nums">
            {formatLedgerAmount(totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1">
            Total Claim
          </p>
          <p className="text-2xl font-black tabular-nums">
            {formatLedgerAmount(totalClaim)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">
            Total TDS
          </p>
          <p className="text-2xl font-black tabular-nums">
            {formatLedgerAmount(totalTds)}
          </p>
        </div>
        <div className="border-l border-slate-700 pl-4">
          <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">
            Grand Total (Gross)
          </p>
          <p className="text-2xl font-black tabular-nums text-emerald-400">
            {formatLedgerAmount(grandTotal)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Date</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Buyer</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Seller</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Amount</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Claim</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">TDS</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Mode</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Narration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment, idx) => (
              <tr key={payment._id || idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-[11px] font-bold text-slate-900">
                  {new Date(payment.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-4 text-[10px] font-bold text-blue-600 uppercase">
                  {payment.buyerCompany || "—"}
                </td>
                <td className="px-4 py-4 text-[10px] font-bold text-amber-600 uppercase">
                  {payment.supplierCompany || "—"}
                </td>
                <td className="px-4 py-4 text-[11px] font-black text-emerald-700 tabular-nums">
                  {formatLedgerAmount(payment.amount)}
                </td>
                <td className="px-4 py-4 text-[11px] font-black text-rose-600 tabular-nums">
                  {payment.claim > 0 ? formatLedgerAmount(payment.claim) : "—"}
                </td>
                <td className="px-4 py-4 text-[11px] font-black text-amber-600 tabular-nums">
                  {payment.tds > 0 ? formatLedgerAmount(payment.tds) : "—"}
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tighter">
                    {payment.paymentMode}
                  </span>
                </td>
                <td className="px-4 py-4 text-[11px] text-slate-600 font-medium max-w-xs truncate" title={buildPaymentParticulars(payment)}>
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
