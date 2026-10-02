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
  <section className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
    <div className="mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Filters</h2>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] xl:items-end">
      <div className="min-w-0">
        <label className="mb-2 block text-sm font-medium text-slate-600">
          From Date
        </label>
        <div className="[&>div]:!max-w-none">
          <DateSelector selectedDate={fromDate} onChange={onFromDateChange} />
        </div>
      </div>
      <div className="min-w-0">
        <label className="mb-2 block text-sm font-medium text-slate-600">
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
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaFilePdf size={14} />
        {exportingFormat === "pdf" ? "Preparing PDF..." : "PDF"}
      </button>
      <button
        type="button"
        onClick={() => onExport("excel")}
        disabled={Boolean(exportingFormat) || loading}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaFileExcel size={14} />
        {exportingFormat === "excel" ? "Preparing Excel..." : "Excel"}
      </button>
    </div>
  </section>
);

export default FinanceReportFilters;
