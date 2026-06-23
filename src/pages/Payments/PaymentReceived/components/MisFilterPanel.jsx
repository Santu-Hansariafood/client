import { FaFilter, FaPrint, FaPlus, FaUndo, FaFilePdf } from "react-icons/fa";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";
import DateRangeSelector from "../../../../common/DateSelector/DateRangeSelector";

const MisFilterPanel = ({
  filters,
  onFilterChange,
  onReset,
  primaryCompanyOptions,
  opposingCompanyOptions,
  saudaOptions,
  selectedCompany,
  selectedOpposingCompany,
  selectedSauda,
  onCompanyChange,
  onOpposingCompanyChange,
  onSaudaChange,
  onPrint,
  onDownloadPaymentAdvice,
  onRecordPayment,
  printing,
  printDisabled,
  ledgerTypeDisabled,
}) => {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#1e3a5f] flex items-center justify-center text-white shadow-lg shadow-[#1e3a5f]/20">
            <FaFilter size={14} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-900 tracking-tight">
              Company & period filters
            </h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Tally MIS · company-to-company
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
          >
            <FaUndo size={11} /> Reset
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={printDisabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] hover:bg-[#152a45] text-white text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 transition"
          >
            {printing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaPrint size={12} />
            )}
            {printing ? "Generating…" : "Print PDF"}
          </button>
          <button
            type="button"
            onClick={onDownloadPaymentAdvice}
            disabled={printDisabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/25 transition"
          >
            {printing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaFilePdf size={12} />
            )}
            {printing ? "Generating…" : "Payment Advice"}
          </button>
          <button
            type="button"
            onClick={onRecordPayment}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/25 transition"
          >
            <FaPlus size={12} /> Record
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
            Ledger type
          </label>
          <select
            value={filters.ledgerType}
            onChange={(e) => onFilterChange("ledgerType", e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1e3a5f]/15 focus:border-[#1e3a5f] outline-none"
          >
            <option value="">All (consolidated)</option>
            <option value="Buyer">Buyer receipts</option>
            <option value="Seller">Seller payments</option>
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
            {filters.ledgerType === "Buyer"
              ? "Buyer company"
              : filters.ledgerType === "Seller"
                ? "Seller company"
                : "Primary company"}
            {filters.ledgerType && (
              <span className="text-rose-500 ml-0.5">*</span>
            )}
          </label>
          <DataDropdown
            options={primaryCompanyOptions}
            selectedOptions={selectedCompany}
            onChange={onCompanyChange}
            placeholder={
              ledgerTypeDisabled ? "Select ledger type first" : "Select company…"
            }
            isMulti={false}
            isDisabled={ledgerTypeDisabled}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5 lg:col-span-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
            {filters.ledgerType === "Buyer"
              ? "Seller company"
              : filters.ledgerType === "Seller"
                ? "Buyer company"
                : "Opposing company"}
          </label>
          <DataDropdown
            options={opposingCompanyOptions}
            selectedOptions={selectedOpposingCompany}
            onChange={onOpposingCompanyChange}
            placeholder={
              selectedCompany ? "Optional filter…" : "Select primary company first"
            }
            isMulti={false}
            isDisabled={!selectedCompany && Boolean(filters.ledgerType)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
            Sauda no.
          </label>
          <DataDropdown
            options={saudaOptions}
            selectedOptions={selectedSauda}
            onChange={onSaudaChange}
            placeholder={
              !selectedCompany
                ? "Select company"
                : saudaOptions.length === 0
                  ? "No saudas"
                  : "Drill-down…"
            }
            isMulti={false}
            isDisabled={!selectedCompany || saudaOptions.length === 0}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
            Period
          </label>
          <DateRangeSelector
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) => onFilterChange("startDate", date)}
            onEndDateChange={(date) => onFilterChange("endDate", date)}
            onClear={() => {
              onFilterChange("startDate", "");
              onFilterChange("endDate", "");
            }}
            className="!h-11 !rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default MisFilterPanel;
