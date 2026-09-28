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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Sauda Report Filters</h2>
        <p className="text-sm text-slate-500">
          View financed Saudas by date range and consignee
        </p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-5 sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">
            From Date
          </label>
          <DateSelector selectedDate={fromDate} onChange={onFromDateChange} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">
            To Date
          </label>
          <DateSelector selectedDate={toDate} onChange={onToDateChange} />
        </div>
        <DataDropdown
          label="Consignee"
          options={consigneeOptions}
          selectedOptions={selectedConsignee}
          onChange={(option) => onConsigneeChange(option?.value || "")}
          placeholder="All Consignees"
          isClearable
        />
        <button
          type="button"
          onClick={() => onExport("pdf")}
          disabled={Boolean(exportingFormat) || loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaFilePdf size={14} />
          {exportingFormat === "pdf" ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => onExport("excel")}
          disabled={Boolean(exportingFormat) || loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaFileExcel size={14} />
          {exportingFormat === "excel"
            ? "Preparing Excel..."
            : "Download Excel"}
        </button>
      </div>
    </div>
  </section>
);

export default FinanceReportFilters;