import { FaSave, FaMoneyBillWave, FaCoins, FaHistory, FaArrowRight } from "react-icons/fa";

const PaymentRecordingPanel = ({
  formData,
  handleInputChange,
  paymentModes,
  loading,
  handleRecordAdvance,
  hasResolvedLedger,
  ledgerBalance,
  ledgerTopSummary,
  allocationSource,
  companyPair,
  fullCompanyMapping,
  history = [],
}) => {
  const totalBuyerAdvance = ledgerBalance.totalAdvanceBalance || 0;
  const pairSpecificAdvance = ledgerBalance.advanceBalance || 0;

  const pendingAmount = ledgerTopSummary.creditBalanceRemaining ?? 0;

  // Filter history for incoming payments (Advance or Sauda-wise with positive amount)
  const incomingPayments = history
    .filter((p) => p.paymentType === "Advance" || p.paymentType === "Sauda-wise")
    .slice(0, 5);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-start justify-between gap-6 bg-emerald-50/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 shrink-0">
            <FaMoneyBillWave size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Record new payment (Credit balance)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Incoming payments from buyer recorded as Credit balance
            </p>
            {fullCompanyMapping && (
              <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-100 rounded-xl shadow-sm w-fit">
                <span className="text-[10px] font-black text-blue-600 uppercase">
                  {companyPair.buyerCompany}
                </span>
                <FaArrowRight className="text-slate-300" size={10} />
                <span className="text-[10px] font-black text-amber-600 uppercase">
                  {companyPair.supplierCompany}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Total Buyer Cr.
            </p>
            <p className="text-lg font-black text-slate-900 tabular-nums">
              ₹{Number(totalBuyerAdvance).toLocaleString("en-IN")}
            </p>
          </div>

          {fullCompanyMapping && (
            <>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">
                  Pair Specific Cr.
                </p>
                <p className="text-lg font-black text-blue-600 tabular-nums">
                  ₹{Number(pairSpecificAdvance).toLocaleString("en-IN")}
                </p>
              </div>
            </>
          )}

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">
              Pool for Allocation
            </p>
            <p className="text-lg font-black text-emerald-600 tabular-nums">
              ₹{Number(pendingAmount || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Credit amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount === 0 ? "" : formData.amount}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                    className="w-full h-[48px] pl-8 pr-4 rounded-xl border-2 border-emerald-100 bg-white focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-black text-lg text-emerald-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-rose-400 ml-1">
                  Claim
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600 font-black">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="claim"
                    value={formData.claim === 0 ? "" : formData.claim}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                    className="w-full h-[48px] pl-8 pr-4 rounded-xl border-2 border-rose-100 bg-white focus:ring-4 focus:ring-rose-600/10 focus:border-rose-600 outline-none transition-all font-black text-lg text-rose-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-amber-400 ml-1">
                  TDS
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-black">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="tds"
                    value={formData.tds === 0 ? "" : formData.tds}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                    className="w-full h-[48px] pl-8 pr-4 rounded-xl border-2 border-amber-100 bg-white focus:ring-4 focus:ring-amber-600/10 focus:border-amber-600 outline-none transition-all font-black text-lg text-amber-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Payment mode
                </label>
                <div className="relative">
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    className="w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                  >
                    {paymentModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Narration
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Payment details..."
                  className="w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-bold text-slate-900 shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <FaHistory size={12} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 max-w-md">
                  Credit balance from buyer will be recorded. Use the Allocation table below to post this credit against specific lorry bills (Dr.).
                </p>
              </div>
              <button
                type="button"
                onClick={handleRecordAdvance}
                disabled={loading || formData.amount <= 0 || !hasResolvedLedger}
                className={`h-[48px] px-8 flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  formData.amount > 0 && !loading && hasResolvedLedger
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <FaSave />
                {loading ? "Saving..." : "Record Credit Entry"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Recent Incoming Credits
              </h4>
              <FaCoins className="text-amber-400" size={12} />
            </div>
            
            <div className="space-y-2">
              {incomingPayments.length > 0 ? (
                incomingPayments.map((payment) => (
                  <div key={payment._id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-slate-900 tabular-nums">
                        ₹{Number((payment.amount || 0) + (payment.claim || 0) + (payment.tds || 0)).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase">
                        {payment.paymentMode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">
                        {new Date(payment.date).toLocaleDateString("en-GB")}
                      </span>
                      <span className="text-[8px] font-bold text-blue-500 uppercase truncate max-w-[100px]">
                        {payment.buyerCompany}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">No recent payments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRecordingPanel;
