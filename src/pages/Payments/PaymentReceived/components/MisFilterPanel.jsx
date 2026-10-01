import { FaFilter, FaPrint, FaPlus, FaUndo, FaEnvelope, FaSearch } from "react-icons/fa";
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
  onCompanySelect,
  onOpposingCompanySelect,
  onSaudaChange,
  onPrint,
  onRecordPayment,
  onSendEmail,
  printing,
  sendingEmail,
  printDisabled,
  ledgerTypeDisabled,
}) => {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-7 pt-5 sm:pt-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <div className="lg:col-span-7 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <FaSearch size={9} className="text-slate-400" />
              Search
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-focus-within:bg-emerald-50 group-focus-within:border-emerald-200 group-focus-within:text-emerald-600 transition-all">
                <FaSearch size={12} />
              </div>
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => onFilterChange("search", e.target.value)}
                placeholder="Lorry number, voucher, company, sauda…"
                className="w-full h-12 pl-14 pr-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500/60 focus:bg-white outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Entry type
            </label>
            <button
              type="button"
              onClick={() => onFilterChange("onlyCredit", !filters.onlyCredit)}
              className={`w-full h-12 px-4 rounded-2xl border-2 text-sm font-black transition-all duration-200 flex items-center justify-between ${
                filters.onlyCredit
                  ? "bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-500 text-emerald-900 shadow-lg shadow-emerald-500/15"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-[11px] font-black tracking-wider shadow-sm transition-all ${
                    filters.onlyCredit
                      ? "bg-gradient-to-br from-emerald-500 to-[#047857] text-white shadow-emerald-500/25"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Cr
                </span>
                <span className="tracking-wide text-[12px] sm:text-sm">
                  {filters.onlyCredit ? "Only Cr." : "Dr. & Cr."}
                </span>
              </span>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  filters.onlyCredit ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                    filters.onlyCredit ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-7 py-4 sm:py-5 mt-1 border-y border-slate-100 bg-gradient-to-br from-slate-50/70 via-white to-blue-50/30 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-blue-600 rounded-2xl blur-sm opacity-25" />
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center text-white shadow-lg shadow-[#1e3a5f]/20 border border-white/10">
              <FaFilter size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              Company &amp; Period Filters
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em]">
                  Tally MIS
                </span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em]">
                Company-to-Company
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-[11px] sm:text-xs font-black uppercase tracking-[0.08em] hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(15,23,42,0.05)] active:scale-[0.98] transition-all duration-200"
          >
            <FaUndo size={11} /> Reset
          </button>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          <button
            type="button"
            onClick={onPrint}
            disabled={printDisabled}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] hover:from-[#152a45] hover:to-[#254a78] text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.08em] shadow-md shadow-[#1e3a5f]/15 hover:shadow-lg hover:shadow-[#1e3a5f]/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
            onClick={() => onSendEmail("MIS")}
            disabled={printDisabled || sendingEmail}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.08em] shadow-md shadow-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {sendingEmail ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaEnvelope size={12} />
            )}
            {sendingEmail ? "Sending…" : "Send MIS"}
          </button>

          <button
            type="button"
            onClick={onRecordPayment}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-gradient-to-br from-[#065f46] via-[#047857] to-[#059669] hover:from-[#044735] hover:via-[#065f46] hover:to-[#047857] text-white text-[11px] sm:text-xs font-black uppercase tracking-[0.08em] shadow-md shadow-emerald-700/15 hover:shadow-lg hover:shadow-emerald-700/25 active:scale-[0.98] transition-all duration-200"
          >
            <FaPlus size={12} /> Record
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-7 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Ledger type
            </label>
            <div className="relative">
              <select
                value={filters.ledgerType}
                onChange={(e) => onFilterChange("ledgerType", e.target.value)}
                className="w-full h-12 px-3.5 pr-10 appearance-none rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500/60 outline-none transition-all duration-200 cursor-pointer"
              >
                <option value="">All (consolidated)</option>
                <option value="Buyer">Buyer receipts</option>
                <option value="Seller">Seller payments</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Buyer company
              {filters.ledgerType && (
                <span className="text-rose-500 ml-0.5">*</span>
              )}
            </label>
            <div className="!mb-0">
              <DataDropdown
                options={primaryCompanyOptions}
                selectedOptions={selectedCompany}
                onChange={onCompanySelect}
                placeholder={
                  ledgerTypeDisabled
                    ? "Select ledger type first"
                    : "Select buyer…"
                }
                isMulti={false}
                isDisabled={ledgerTypeDisabled}
                className="!rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Seller company
            </label>
            <div className="!mb-0">
              <DataDropdown
                options={opposingCompanyOptions}
                selectedOptions={selectedOpposingCompany}
                onChange={onOpposingCompanySelect}
                placeholder="Optional seller…"
                isMulti={false}
                isDisabled={false}
                className="!rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Sauda no.
            </label>
            <div className="!mb-0">
              <DataDropdown
                options={saudaOptions}
                selectedOptions={selectedSauda}
                onChange={onSaudaChange}
                placeholder={
                  !selectedCompany
                    ? "Select company first"
                    : saudaOptions.length === 0
                      ? "No saudas"
                      : "Sauda drill-down"
                }
                isMulti={false}
                isDisabled={!selectedCompany || saudaOptions.length === 0}
                className="!rounded-2xl"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 pt-1">
          <div className="lg:col-span-7 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ml-0.5 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Period range
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
              className="!h-12 !rounded-2xl"
            />
          </div>
          <div className="lg:col-span-5 flex items-end">
            <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                <span>
                  Filters active
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-black tabular-nums shadow-sm">
                  {[
                    filters.ledgerType,
                    selectedCompany,
                    selectedOpposingCompany,
                    selectedSauda,
                    filters.startDate,
                    filters.endDate,
                    filters.onlyCredit,
                    filters.search,
                  ].filter(Boolean).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisFilterPanel;
