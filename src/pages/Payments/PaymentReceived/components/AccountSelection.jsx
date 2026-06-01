import {
  FaFilter,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../../common/Buttons/Buttons";

const AccountSelection = ({
  allocationSource,
  setAllocationSource,
  formData,
  handleInputChange,
  ledgerTypes,
  setFormData,
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
}) => {
  const ledgerTypeOption =
    ledgerTypes.find((t) => t.value === formData.ledgerType) ||
    ledgerTypes[0];

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

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            {
              id: "fresh",
              label: "Payment Received",
              icon: <FaMoneyBillWave size={12} />,
            },
            { id: "advance", label: "From Advance", icon: <FaExchangeAlt size={12} /> },
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
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-[#1e3a5f] rounded-full" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              Optional filters
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Ledger type
              </label>
              <DataDropdown
                options={ledgerTypes}
                selectedOptions={ledgerTypeOption}
                onChange={(opt) =>
                  setFormData((prev) => ({
                    ...prev,
                    ledgerType: opt?.value ?? "",
                  }))
                }
                isMulti={false}
                className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
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
                    formData.ledgerType === "Seller"
                      ? false
                      : !hasBuyerCompany
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

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              Record new payment
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount === 0 ? "" : formData.amount}
                  onChange={handleInputChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0.00"
                  className="w-full h-[42px] pl-8 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Payment mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
              >
                {paymentModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Narration
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Narration for advance / on-account..."
                className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all font-bold text-slate-900"
              />
            </div>
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
    </div>
  );

};

export default AccountSelection;
