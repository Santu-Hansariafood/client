import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import DataDropdown from "../../../../common/DataDropdown/DataDropdown";
import DateSelector from "../../../../common/DateSelector/DateSelector";

const FinanceReportFilters = ({
  fromDate,
  toDate,
  consigneeOptions,
  selectedConsignee,
  exportingFormat,
  loading,
  onFromDateChange,
  onToDateChange,
  onConsigneeChange,
  onExport,
}) => (
  <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
    <div className="mb-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Sauda Report Filters</h2>
        <p className="text-sm text-slate-500">
          View financed Saudas by date range and consignee
        </p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] xl:items-end">
        <div className="min-w-0">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
            From Date
          </label>
          <div className="[&>div]:!max-w-none">
            <DateSelector selectedDate={fromDate} onChange={onFromDateChange} />
          </div>
        </div>
        <div className="min-w-0">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
            To Date
          </label>
          <div className="[&>div]:!max-w-none">
            <DateSelector selectedDate={toDate} onChange={onToDateChange} />
          </div>
        </div>
        <div className="min-w-0 [&>div]:!mb-0">
          <DataDropdown
            label="Consignee"
            options={consigneeOptions}
            selectedOptions={selectedConsignee}
            onChange={(option) => onConsigneeChange(option?.value || "")}
            placeholder="All Consignees"
            isClearable
          />
        </div>
        <button
          type="button"
          onClick={() => onExport("pdf")}
          disabled={Boolean(exportingFormat) || loading}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-800 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaFilePdf size={14} />
          {exportingFormat === "pdf" ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => onExport("excel")}
          disabled={Boolean(exportingFormat) || loading}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaFileExcel size={14} />
          {exportingFormat === "excel"
            ? "Preparing Excel..."
            : "Download Excel"}
        </button>
    </div>
  </section>
);

export default FinanceReportFilters;