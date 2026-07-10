import { FaFilter, FaPrint, FaPlus, FaUndo, FaFilePdf, FaEnvelope, FaCheckCircle } from "react-icons/fa";
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
  onDownloadPaymentAdvice,
  onRecordPayment,
  onSendEmail,
  printing,
  sendingEmail,
  printDisabled,
  ledgerTypeDisabled,
}) => {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
      <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-blue-600 rounded-2xl blur opacity-30"></div>
            <div className="relative w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-blue-600 flex items-center justify-center text-white shadow-xl shadow-[#1e3a5f]/25">
              <FaFilter size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
              Company & Period Filters
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tally MIS
                </span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Company-to-Company
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold uppercase tracking-wide hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <FaUndo size={12} /> Reset
          </button>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          
          <button
            type="button"
            onClick={onPrint}
            disabled={printDisabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1e3a5f] to-blue-600 hover:from-[#152a45] hover:to-blue-700 text-white text-xs font-semibold uppercase tracking-wide shadow-lg shadow-[#1e3a5f]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {printing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaPrint size={13} />
            )}
            {printing ? "Generating…" : "Print PDF"}
          </button>
          
          <button
            type="button"
            onClick={onDownloadPaymentAdvice}
            disabled={printDisabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-semibold uppercase tracking-wide shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {printing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaFilePdf size={13} />
            )}
            {printing ? "Generating…" : "Payment Advice"}
          </button>

          <button
            type="button"
            onClick={() => onSendEmail("MIS")}
            disabled={printDisabled || sendingEmail}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold uppercase tracking-wide shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {sendingEmail ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaEnvelope size={13} />
            )}
            {sendingEmail ? "Sending…" : "Send MIS"}
          </button>

          <button
            type="button"
            onClick={() => onSendEmail("PaymentAdvice")}
            disabled={printDisabled || sendingEmail}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs font-semibold uppercase tracking-wide shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {sendingEmail ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaEnvelope size={13} />
            )}
            {sendingEmail ? "Sending…" : "Send Advice"}
          </button>

          <button
            type="button"
            onClick={onRecordPayment}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-semibold uppercase tracking-wide shadow-lg shadow-emerald-600/20 transition-all duration-200"
          >
            <FaPlus size={13} /> Record
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* First row: Ledger type, Primary company, Opposing company */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
              Ledger type
            </label>
            <select
              value={filters.ledgerType}
              onChange={(e) => onFilterChange("ledgerType", e.target.value)}
              className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1e3a5f]/15 focus:border-[#1e3a5f] outline-none transition-all"
            >
              <option value="">All (consolidated)</option>
              <option value="Buyer">Buyer receipts</option>
              <option value="Seller">Seller payments</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
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
                  ledgerTypeDisabled ? "Select ledger type first" : "Select buyer company…"
                }
                isMulti={false}
                isDisabled={ledgerTypeDisabled}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
              Seller company
            </label>
            <div className="!mb-0">
              <DataDropdown
                options={opposingCompanyOptions}
                selectedOptions={selectedOpposingCompany}
                onChange={onOpposingCompanySelect}
                placeholder="Optional seller company filter…"
                isMulti={false}
                isDisabled={false}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Second row: Sauda no, Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">
              Sauda no.
            </label>
            <div className="!mb-0">
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
          </div>

          <div className="space-y-1.5">
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
              className="!h-12 !rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisFilterPanel;
