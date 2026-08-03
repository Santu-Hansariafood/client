import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import {
  FaChartBar,
  FaFileExcel,
  FaFilePdf,
  FaFilter,
  FaTruckLoading,
  FaTruck,
  FaBoxes,
  FaShieldAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { downloadFile } from "../../../utils/fileDownloader";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);

const API_URL = "/sauda-reports";
const REPORT_OPTIONS = [
  { value: "sauda", label: "Sauda Report" },
  { value: "loading", label: "Loading Report" },
  { value: "unloading", label: "Unloading Report" },
];

const formatDateParam = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "N/A";

const formatWeight = (value) => Number(value || 0).toFixed(3);
const formatRate = (value) => Number(value || 0).toFixed(2);

const buildRows = (data = [], currentPage = 1, itemsPerPage = 10) =>
  data.map((item, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    formatDisplayDate(item.date),
    item.saudaNo || "N/A",
    <div key={`consignee-${item._id || index}`} className="max-w-[180px] truncate">
      {item.consignee || "N/A"}
    </div>,
    <div key={`buyer-company-${item._id || index}`} className="max-w-[180px] truncate">
      {item.buyerCompany || "N/A"}
    </div>,
    <div key={`seller-company-${item._id || index}`} className="max-w-[180px] truncate">
      {item.sellerCompany || "N/A"}
    </div>,
    <span
      key={`commodity-${item._id || index}`}
      className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100"
    >
      {item.commodity || "N/A"}
    </span>,
    <span key={`quantity-${item._id || index}`} className="font-semibold text-slate-700">
      {formatWeight(item.quantity)}
    </span>,
    <span key={`rate-${item._id || index}`} className="font-semibold text-slate-700">
      {formatRate(item.rate)}
    </span>,
    item.lorryNumber || "-",
    formatDisplayDate(item.loadingDate),
    <span key={`loading-${item._id || index}`} className="font-semibold text-blue-700">
      {formatWeight(item.loadingWeight)}
    </span>,
    formatDisplayDate(item.unloadingDate),
    <span key={`unloading-${item._id || index}`} className="font-semibold text-violet-700">
      {formatWeight(item.unloadingWeight)}
    </span>,
  ]);

const PartyReportPage = ({ partyType }) => {
  const { userRole } = useAuth();
  const isBuyer = partyType === "buyer";
  const partyLabel = isBuyer ? "Buyer Name" : "Seller Name";

  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [reportType, setReportType] = useState(REPORT_OPTIONS[0]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalLoadingWeight: 0,
    totalUnloadingWeight: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 10;

  const tableHeaders = useMemo(
    () => [
      "Sl No",
      "Date",
      "Sauda No",
      "Consignee",
      "Buyer Company",
      "Seller Company",
      "Commodity",
      "Quantity",
      "Rate",
      "Lorry No",
      "Loading Date",
      "Loading Wt",
      "Unloading Date",
      "Unloading Wt",
    ],
    [],
  );

  const fetchPartyOptions = useCallback(async () => {
    setFiltersLoading(true);
    try {
      clearApiCache();
      const response = await api.get(`${API_URL}/filters`, {
        params: { partyType },
      });
      setPartyOptions(response.data?.parties || []);
    } catch (error) {
      console.error("Failed to load report filters:", error);
      toast.error("Failed to load report filters");
    } finally {
      setFiltersLoading(false);
    }
  }, [partyType]);

  useEffect(() => {
    fetchPartyOptions();
  }, [fetchPartyOptions]);

  const fetchReportData = useCallback(async () => {
    if (!appliedFilters) return;

    setLoading(true);
    try {
      const response = await api.get(API_URL, {
        params: {
          partyType,
          reportType: appliedFilters.reportType,
          partyValue: appliedFilters.party.value,
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          page: currentPage,
          limit: itemsPerPage,
        },
      });

      setRows(response.data?.data || []);
      setTotalItems(response.data?.total || 0);
      setSummary(
        response.data?.summary || {
          totalRecords: 0,
          totalLoadingWeight: 0,
          totalUnloadingWeight: 0,
        },
      );
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load report data",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, itemsPerPage, partyType]);

  useEffect(() => {
    if (appliedFilters) {
      fetchReportData();
    }
  }, [appliedFilters, currentPage, fetchReportData]);

  const handleGenerateReport = () => {
    const formattedStartDate = formatDateParam(startDate);
    const formattedEndDate = formatDateParam(endDate);

    if (!selectedParty || !formattedStartDate || !formattedEndDate) {
      toast.error("Please select party name, start date, and end date");
      return;
    }

    if (new Date(formattedStartDate) > new Date(formattedEndDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setCurrentPage(1);
    setAppliedFilters({
      party: selectedParty,
      reportType: reportType.value,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    });
  };

  const handleClear = () => {
    setSelectedParty(null);
    setReportType(REPORT_OPTIONS[0]);
    setStartDate(null);
    setEndDate(null);
    setAppliedFilters(null);
    setRows([]);
    setSummary({
      totalRecords: 0,
      totalLoadingWeight: 0,
      totalUnloadingWeight: 0,
    });
    setTotalItems(0);
    setCurrentPage(1);
  };

  const handleExport = useCallback(
    async (format) => {
      if (exporting) return;

      if (!appliedFilters) {
        toast.error("Generate the report first");
        return;
      }

      let toastId;
      try {
        setExporting(true);
        toastId = toast.loading(
          `Preparing ${format === "pdf" ? "PDF" : "Excel"} report...`,
        );

        const response = await api.get(`${API_URL}/${format}`, {
          params: {
            partyType,
            reportType: appliedFilters.reportType,
            partyValue: appliedFilters.party.value,
            partyLabel: appliedFilters.party.label,
            startDate: appliedFilters.startDate,
            endDate: appliedFilters.endDate,
          },
          responseType: "blob",
          timeout: 120000,
        });

        const extension = format === "pdf" ? "pdf" : "xlsx";
        await downloadFile(
          new Blob([response.data]),
          `${isBuyer ? "Buyer" : "Seller"}_${appliedFilters.reportType}_report.${extension}`,
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        toast.dismiss(toastId);
        toast.success(
          `${format === "pdf" ? "PDF" : "Excel"} report downloaded successfully`,
        );
      } catch (error) {
        if (toastId) toast.dismiss(toastId);
        console.error(`Failed to download ${format} report:`, error);
        toast.error(
          error?.response?.data?.message ||
            `Failed to download ${format.toUpperCase()} report`,
        );
      } finally {
        setExporting(false);
      }
    },
    [appliedFilters, exporting, isBuyer, partyType],
  );

  const reportRows = useMemo(
    () => buildRows(rows, currentPage, itemsPerPage),
    [rows, currentPage, itemsPerPage],
  );

  if (userRole !== "Admin") {
    return (
      <AdminPageShell
        title="Report Access"
        subtitle="These reports are available only to admin users."
        icon={FaShieldAlt}
      >
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">
          Only admin can access buyer and seller sauda reports.
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={isBuyer ? "Buyer Reports" : "Seller Reports"}
      subtitle={`Generate polished sauda, loading, and unloading reports for the selected ${partyLabel.toLowerCase()} and date range.`}
      icon={FaChartBar}
      onRefresh={fetchPartyOptions}
    >
      <Suspense fallback={<Loading />}>
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                <FaShieldAlt className="text-emerald-400" />
                Admin Only
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                {isBuyer ? "Buyer Side Report Center" : "Seller Side Report Center"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">
                Select the {partyLabel.toLowerCase()}, choose the report type, apply a start and end date, and generate export-ready PDF or Excel files.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Total Records
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {summary.totalRecords || totalItems || 0}
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Total Loading
                </div>
                <div className="mt-2 text-2xl font-black text-blue-700">
                  {formatWeight(summary.totalLoadingWeight)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Total Unloading
                </div>
                <div className="mt-2 text-2xl font-black text-violet-700">
                  {formatWeight(summary.totalUnloadingWeight)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <FaFilter />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Report Filters</h3>
              <p className="text-sm text-slate-500">
                Start with party selection, then choose the report window and export format.
              </p>
            </div>
          </div>

          {filtersLoading ? (
            <Loading />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DataDropdown
                  label={partyLabel}
                  options={partyOptions}
                  selectedOptions={selectedParty}
                  onChange={setSelectedParty}
                  placeholder={`Select ${partyLabel.toLowerCase()}`}
                  isClearable
                />

                <DataDropdown
                  label="Report Type"
                  options={REPORT_OPTIONS}
                  selectedOptions={reportType}
                  onChange={(option) => setReportType(option || REPORT_OPTIONS[0])}
                  placeholder="Select report type"
                />

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Start Date
                  </label>
                  <DateSelector selectedDate={startDate} onChange={setStartDate} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                    End Date
                  </label>
                  <DateSelector selectedDate={endDate} onChange={setEndDate} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
                >
                  <FaCalendarAlt />
                  Generate Report
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("excel")}
                  disabled={exporting || !appliedFilters}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFileExcel />
                  Excel
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
                  disabled={exporting || !appliedFilters}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFilePdf />
                  PDF
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <FaBoxes />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Current Report
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              {appliedFilters
                ? REPORT_OPTIONS.find(
                    (option) => option.value === appliedFilters.reportType,
                  )?.label
                : "Not Generated"}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <FaTruck />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Selected Party
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              {appliedFilters?.party?.label || "Select a party"}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <FaTruckLoading />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Date Window
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              {appliedFilters
                ? `${formatDisplayDate(appliedFilters.startDate)} to ${formatDisplayDate(appliedFilters.endDate)}`
                : "Choose a range"}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Report Preview</h3>
              <p className="text-sm text-slate-500">
                Review the generated rows before downloading the final file.
              </p>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <>
              <Tables headers={tableHeaders} rows={reportRows} />
              {appliedFilters && totalItems > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </Suspense>
    </AdminPageShell>
  );
};

PartyReportPage.propTypes = {
  partyType: PropTypes.oneOf(["buyer", "seller"]).isRequired,
};

export default PartyReportPage;
