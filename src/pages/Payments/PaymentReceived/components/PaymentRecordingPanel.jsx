import { FaSave, FaMoneyBillWave, FaCoins, FaHistory } from "react-icons/fa";

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
}) => {
  const previousBalance = fullCompanyMapping
    ? ledgerBalance.advanceBalance
    : ledgerBalance.totalAdvanceBalance;

  const pendingAmount = ledgerTopSummary.creditBalanceRemaining ?? 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-emerald-50/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <FaMoneyBillWave size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Record new payment (Credit balance)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Payment received will be added to the buyer's credit balance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Previous Balance (Cr.)
            </p>
            <p className="text-lg font-black text-blue-600 tabular-nums">
              ₹{Number(previousBalance || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Current Pending (Cr.)
            </p>
            <p className="text-lg font-black text-emerald-600 tabular-nums">
              ₹{Number(pendingAmount || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="lg:col-span-1 space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Narration / Remarks
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
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRecordAdvance}
              disabled={loading || formData.amount <= 0 || !hasResolvedLedger}
              className={`w-full h-[48px] flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                formData.amount > 0 && !loading && hasResolvedLedger
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <FaSave />
              {loading ? "Saving..." : "Record Payment (Cr.)"}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              <FaHistory size={12} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 max-w-md">
              Advance (Cr.) is money from the buyer on account for the selected
              seller — allocate against lorries (Dr.) below (From Advance tab).
            </p>
          </div>
          {formData.amount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-lg animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                Posting: ₹{Number(formData.amount).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRecordingPanel;
