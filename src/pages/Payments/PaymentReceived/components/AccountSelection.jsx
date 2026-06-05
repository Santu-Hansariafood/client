import {
  FaFilter,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../../common/Buttons/Buttons";
import CreditBalancePanel from "./CreditBalancePanel";

const AccountSelection = ({
  allocationSource,
  setAllocationSource,
  formData,
  handleInputChange,
  primaryCompanyOptions,
  opposingCompanyOptions,
  selectedCompanyOption,
  selectedOpposingCompanyOption,
  handleCompanyChange,
  handleOpposingCompanyChange,
  handleClearCompany,
  handleClearOpposingCompany,
  paymentModes,
  loading,
  handleRecordAdvance,
  hasResolvedLedger,
  loadingSellerOptions,
  hasBuyerCompany,
  companyPair = {},
  fullCompanyMapping = false,
  ledgerTopSummary = {},
  creditByPair = [],
  onSelectCreditPair,
}) => {
  if (!formData) return null;
  const showEntryLedger =
    (Number(formData.amount) || 0) > 0 || hasBuyerCompany;
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1e3a5f]/20">
            <FaFilter size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Filters & new payment
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Data loads automatically · use filters only to narrow the list
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              {
                id: "fresh",
                label: "Payment Received",
                icon: <FaMoneyBillWave size={12} />,
              },
              {
                id: "advance",
                label: "From Advance",
                icon: <FaExchangeAlt size={12} />,
              },
            ].map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => setAllocationSource(source.id)}
                className={`flex items-center gap-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  allocationSource === source.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {source.icon}
                {source.label}
              </button>
            ))}
          </div>
          {allocationSource === "fresh" && (formData.amount || 0) <= 0 && (
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter animate-pulse">
              Tip: Use From Advance to spend buyer Dr. on seller lorries
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-[#1e3a5f] rounded-full" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              Optional filters
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Entry date (vouchers)
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3a5f]/10 focus:border-[#1e3a5f] outline-none transition-all font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Buyer company
              </label>
              <div className="relative">
                <DataDropdown
                  options={primaryCompanyOptions}
                  selectedOptions={selectedCompanyOption}
                  onChange={(opt) =>
                    opt ? handleCompanyChange(opt) : handleClearCompany()
                  }
                  placeholder="All buyers"
                  isMulti={false}
                  className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                />
                {formData.companyId && (
                  <button
                    type="button"
                    onClick={handleClearCompany}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500"
                    title="Clear filter"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
              {formData.companyId && !hasResolvedLedger && (
                <p className="text-[10px] font-bold text-amber-600 ml-1">
                  No ledger linked — required only to record payment
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Seller company
              </label>
              <div className="relative">
                <DataDropdown
                  options={opposingCompanyOptions}
                  selectedOptions={selectedOpposingCompanyOption}
                  onChange={(opt) =>
                    opt
                      ? handleOpposingCompanyChange(opt)
                      : handleClearOpposingCompany()
                  }
                  placeholder={
                    hasBuyerCompany
                      ? loadingSellerOptions
                        ? "Loading sellers…"
                        : "Select seller for this buyer"
                      : "Select buyer first"
                  }
                  isMulti={false}
                  isDisabled={
                    formData.ledgerType === "Seller" ? false : !hasBuyerCompany
                  }
                  className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                />
                {formData.opposingCompanyId && (
                  <button
                    type="button"
                    onClick={handleClearOpposingCompany}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500"
                    title="Clear filter"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 bg-emerald-50/30 -mx-6 px-6 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              Record new payment (credited balance)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                credited balance
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
                disabled={loading || formData.amount <= 0}
                className={`w-full h-[48px] flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  formData.amount > 0 && !loading
                    ? "bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <FaSave />
                Record buyer Dr. advance
              </button>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-2">
            Advance (Dr.) is money from the buyer on account for the selected
            seller — allocate Cr. per lorry below (From Advance tab).
          </p>
          {formData.amount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                credited balance ₹{Number(formData.amount).toLocaleString("en-IN")} → adjusting on lorries below
              </p>
            </div>
          )}

          {dateTotal > 0 && (
            <div className="mt-2 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                    <FaMoneyBillWave size={12} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">
                      Payments Recorded for Today
                    </p>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1">
                      {new Date(formData.date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                      {hasBuyerCompany ? ` · ${companyPair.buyerCompany}` : ""}
                      {fullCompanyMapping ? ` → ${companyPair.supplierCompany}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-tighter leading-none mb-1">
                    Total
                  </p>
                  <p className="text-xl font-black text-emerald-900 tabular-nums tracking-tight">
                    ₹{Number(dateTotal).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showEntryLedger && (
            <div className="mt-4">
              <CreditBalancePanel
                debitEntryTotal={ledgerTopSummary.debitEntryTotal ?? 0}
                creditToSeller={ledgerTopSummary.creditToSeller ?? 0}
                creditPostedToSeller={ledgerTopSummary.creditPostedToSeller ?? 0}
                creditPendingInForm={ledgerTopSummary.creditPendingInForm ?? 0}
                debitBalanceRemaining={ledgerTopSummary.debitBalanceRemaining ?? 0}
                creditByPair={creditByPair}
                fullCompanyMapping={fullCompanyMapping}
                buyerCompany={companyPair.buyerCompany || ""}
                supplierCompany={companyPair.supplierCompany || ""}
                allocationSource={allocationSource}
                onSelectCreditPair={onSelectCreditPair}
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Buttons
            label={`Record advance (Rs. ${formData.amount || 0})`}
            onClick={handleRecordAdvance}
            disabled={
              loading ||
              !formData.companyId ||
              !hasResolvedLedger ||
              formData.amount <= 0 ||
              allocationSource !== "fresh"
            }
            variant="primary"
            className="h-[42px] rounded-xl shadow-lg shadow-emerald-600/20 sm:min-w-[240px]"
            icon={<FaSave />}
          />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Company + ledger required only when saving a payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSelection;
