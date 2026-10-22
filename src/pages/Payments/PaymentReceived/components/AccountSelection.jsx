import {
  FaFilter,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaTimes,
} from "react-icons/fa";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";

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
  hasResolvedLedger,
  loadingSellerOptions,
  hasBuyerCompany,
  companyPair = {},
  fullCompanyMapping = false,
  dateTotal = 0,
  isEditMode = false,
}) => {
  if (!formData) return null;
  const showEntryLedger = (Number(formData.amount) || 0) > 0 || hasBuyerCompany;
  return (
    <div className="lux-card lux-gold-top overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-[#ece4d2] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-lux-emerald to-lux-deep rounded-2xl flex items-center justify-center text-lux-gold-soft shadow-lg shadow-lux-emerald/20">
            <FaFilter size={18} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-lux-ink">
              Filters & new payment
            </h3>
            <p className="text-xs text-lux-muted font-medium">
              Data loads automatically · use filters only to narrow the list
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex bg-lux-ivory p-1 rounded-xl border border-[#ece4d2]">
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
                    ? "bg-lux-cream text-lux-ink shadow-sm"
                    : "text-lux-muted hover:text-lux-ink"
                }`}
              >
                {source.icon}
                {source.label}
              </button>
            ))}
          </div>
          {allocationSource === "fresh" && (formData.amount || 0) <= 0 && (
            <p className="text-[9px] font-black text-lux-emerald uppercase tracking-tighter animate-pulse">
              Tip: Use From Advance to spend buyer Cr. advance on seller lorries
            </p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-lux-gold rounded-full" />
            <h4 className="lux-eyebrow">
              Optional filters
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Entry date (vouchers)
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full h-[42px] px-4 rounded-xl border border-[#e4dbc6] bg-lux-cream focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-gold outline-none transition-all font-bold text-lux-ink"
              />
            </div>
            <div className="space-y-2">
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                  className="rounded-xl transition-all border-[#e4dbc6] hover:border-lux-gold-soft"
                />
                {formData.companyId && (
                  <button
                    type="button"
                    onClick={handleClearCompany}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-lux-muted hover:text-rose-500"
                    title="Clear filter"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
              {formData.companyId && !hasResolvedLedger && (
                <p className="text-[10px] font-bold text-lux-emerald ml-1">
                  No ledger linked — required only to record payment
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                  className="rounded-xl transition-all border-[#e4dbc6] hover:border-lux-gold-soft"
                />
                {formData.opposingCompanyId && (
                  <button
                    type="button"
                    onClick={handleClearOpposingCompany}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-lux-muted hover:text-rose-500"
                    title="Clear filter"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {dateTotal > 0 && (
          <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lux-emerald to-lux-deep flex items-center justify-center text-lux-gold-soft">
                  <FaMoneyBillWave size={12} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">
                    Payments Recorded for Today
                  </p>
                  <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1">
                    {new Date(formData.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {hasBuyerCompany ? ` · ${companyPair.buyerCompany}` : ""}
                    {fullCompanyMapping
                      ? ` → ${companyPair.supplierCompany}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-xs font-semibold text-emerald-900 tabular-nums tracking-tight">
                  ₹{Number(dateTotal).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSelection;
