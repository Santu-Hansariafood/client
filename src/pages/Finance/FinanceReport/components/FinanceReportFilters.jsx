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
  <section className="lux-card lux-gold-top p-4 sm:p-6 lg:p-8">
    <div className="mb-4">
      <div>
        <h2 className="font-serif text-base font-semibold text-lux-ink">
          Filters
        </h2>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] xl:items-end">
      <div className="min-w-0">
        <label className="mb-2 block font-serif text-sm font-medium text-lux-ink">
          From Date
        </label>
        <div className="[&>div]:!max-w-none">
          <DateSelector selectedDate={fromDate} onChange={onFromDateChange} />
        </div>
      </div>
      <div className="min-w-0">
        <label className="mb-2 block font-serif text-sm font-medium text-lux-ink">
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
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#ece4d2] bg-lux-cream px-3 text-sm font-medium text-lux-emerald transition-colors hover:bg-lux-ivory disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaFilePdf size={14} />
        {exportingFormat === "pdf" ? "Preparing PDF..." : "PDF"}
      </button>
      <button
        type="button"
        onClick={() => onExport("excel")}
        disabled={Boolean(exportingFormat) || loading}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#ece4d2] bg-lux-cream px-3 text-sm font-medium text-lux-emerald transition-colors hover:bg-lux-ivory disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaFileExcel size={14} />
        {exportingFormat === "excel" ? "Preparing Excel..." : "Excel"}
      </button>
    </div>
  </section>
);

export default FinanceReportFilters;
