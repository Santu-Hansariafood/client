import { useState } from "react";
import {
  FaSave,
  FaMoneyBillWave,
  FaHistory,
  FaArrowRight,
} from "react-icons/fa";
import DateSelector from "../../../../common/DateSelector/DateSelector";

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
  isEditMode = false,
}) => {
  const totalBuyerAdvance = ledgerBalance.totalAdvanceBalance || 0;
  const pairSpecificAdvance = ledgerBalance.advanceBalance || 0;

  const pendingAmount = ledgerTopSummary.creditBalanceRemaining ?? 0;

  const [rawMoneyValues, setRawMoneyValues] = useState({
    amount: "",
    claim: "",
    tds: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  const handleDateChange = (date, name) => {
    const formattedDate = date
      ? new Date(date).toISOString().split("T")[0]
      : "";
    handleInputChange({ target: { name, value: formattedDate } });
  };

  const MONEY_REGEX = /^\d*\.?\d{0,2}$/;

  const handleMoneyChange = (e, name) => {
    const rawValue = e.target.value;
    if (rawValue === "" || MONEY_REGEX.test(rawValue)) {
      setRawMoneyValues((prev) => ({ ...prev, [name]: rawValue }));
      handleInputChange({ target: { name, value: rawValue } });
    }
  };

  const handleMoneyFocus = (name) => {
    setFocusedField(name);
    const currentValue = formData[name];
    if (currentValue !== 0 && currentValue != null) {
      setRawMoneyValues((prev) => ({
        ...prev,
        [name]: String(currentValue),
      }));
    }
  };

  const handleMoneyBlur = (e, name) => {
    setFocusedField(null);
    setRawMoneyValues((prev) => ({ ...prev, [name]: "" }));
    const rawValue = e.target.value;
    if (rawValue === "") return;
    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue)) {
      handleInputChange({
        target: { name, value: numValue.toFixed(2) },
      });
    }
  };

  const formatMoneyValue = (name, numValue) => {
    if (focusedField === name) {
      const raw = rawMoneyValues[name];
      if (raw !== "") return raw;
    }
    if (numValue === 0 || numValue === "" || numValue == null) return "";
    const num = Number(numValue);
    if (Number.isNaN(num)) return "";
    return num.toFixed(2);
  };

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
                <span className="text-[10px] font-black text-green-600 uppercase">
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
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Credit amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="amount"
                    value={formatMoneyValue("amount", formData.amount)}
                    onChange={(e) => handleMoneyChange(e, "amount")}
                    onFocus={() => handleMoneyFocus("amount")}
                    onBlur={(e) => handleMoneyBlur(e, "amount")}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                    className="w-full h-[48px] pl-8 pr-4 rounded-xl border-2 bg-white outline-none transition-all font-black text-lg shadow-sm border-emerald-100 focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 text-emerald-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Claim amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 font-black">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="claim"
                    value={formatMoneyValue("claim", formData.claim)}
                    onChange={(e) => handleMoneyChange(e, "claim")}
                    onFocus={() => handleMoneyFocus("claim")}
                    onBlur={(e) => handleMoneyBlur(e, "claim")}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                    className="w-full h-[48px] pl-8 pr-4 rounded-xl border-2 bg-white outline-none transition-all font-black text-lg shadow-sm border-purple-100 focus:ring-4 focus:ring-purple-600/10 focus:border-purple-600 text-purple-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  TDS amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600 font-black">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="tds"
                    value={formatMoneyValue("tds", formData.tds)}
                    onChange={(e) => handleMoneyChange(e, "tds")}
                    onFocus={() => handleMoneyFocus("tds")}
                    onBlur={(e) => handleMoneyBlur(e, "tds")}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                    className="w-full h-[48px] pl-8 pr-4 rounded-xl border-2 bg-white outline-none transition-all font-black text-lg shadow-sm border-rose-100 focus:ring-4 focus:ring-rose-600/10 focus:border-rose-600 text-rose-900"
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
                    className="w-full h-[48px] px-4 rounded-xl border bg-white outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm border-slate-200 focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600"
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
                  className="w-full h-[48px] px-4 rounded-xl border bg-white outline-none transition-all font-bold text-slate-900 shadow-sm border-slate-200 focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Credit date
                </label>
                <DateSelector
                  selectedDate={formData.allocationDate}
                  onChange={(date) => handleDateChange(date, "allocationDate")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-500">
                  <FaHistory size={12} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 max-w-md">
                  Credit balance from buyer will be recorded. Use the Allocation table below to post this credit against specific lorry bills (Dr.).
                </p>
              </div>
              <button
                type="button"
                onClick={handleRecordAdvance}
                disabled={
                  loading || formData.amount <= 0 || !hasResolvedLedger
                }
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
        </div>
      </div>
    </div>
  );
};

export default PaymentRecordingPanel;
