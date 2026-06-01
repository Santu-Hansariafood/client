import {
  FaFilter,
  FaMoneyBillWave,
  FaHistory,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import SearchBox from "../../../../common/SearchBox/SearchBox";
import Loading from "../../../../common/Loading/Loading";
import Paginations from "../../../../common/Paginations/Paginations";
import DateRangeSelector from "../../../../common/DateSelector/DateRangeSelector";
import CompanyLedgerBanner from "./CompanyLedgerBanner";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

const AllocationLedger = ({
  allocationSource,
  formData,
  unallocatedBalance,
  setFormData,
  tableSearch,
  setTableSearch,
  entries,
  fetchingEntries,
  columns,
  entriesPage,
  entriesTotal,
  entriesPageSize,
  fetchEntries,
  entryStats,
  dateTotal,
  ledgerBalance,
  companyPair,
}) => {
  const hasCompanyFilter =
    Boolean(formData.companyId) || Boolean(formData.opposingCompanyId);
  const showPagination = entriesTotal > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center text-white shadow-sm">
              <FaFilter size={14} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                {formData.ledgerType === "Buyer"
                  ? allocationSource === "fresh"
                    ? "Payment Received Ledger"
                    : "Advance Adjustment"
                  : allocationSource === "fresh"
                    ? "Payment Sent Ledger"
                    : "Advance Adjustment"}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                {allocationSource === "fresh"
                  ? "Allocate payment to lorry / sauda"
                  : `Using Rs. ${ledgerBalance.advanceBalance.toLocaleString()} credit`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {allocationSource === "fresh" && formData.amount > 0 && (
              <div className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-700">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 leading-none mb-1">
                    {formData.ledgerType === "Buyer"
                      ? "Available to allocate"
                      : "Available to send"}
                  </span>
                  <span className="text-sm font-black italic tracking-tight tabular-nums">
                    Rs. {unallocatedBalance.toLocaleString("en-IN")}
                  </span>
                </div>
                <FaMoneyBillWave className="text-emerald-400 animate-pulse" />
              </div>
            )}

            <DateRangeSelector
              startDate={formData.filterStartDate}
              endDate={formData.filterEndDate}
              onStartDateChange={(date) =>
                setFormData((prev) => ({ ...prev, filterStartDate: date }))
              }
              onEndDateChange={(date) =>
                setFormData((prev) => ({ ...prev, filterEndDate: date }))
              }
              onClear={() =>
                setFormData((prev) => ({
                  ...prev,
                  filterStartDate: "",
                  filterEndDate: "",
                }))
              }
              className="!bg-white !px-3 !py-1.5 shadow-sm"
            />

            <SearchBox
              placeholder="Search Sauda / Lorry..."
              items={[]}
              onSearch={setTableSearch}
              returnQuery={true}
              className="!max-w-[300px]"
            />
          </div>
        </div>

        <CompanyLedgerBanner
          buyerCompany={companyPair?.buyerCompany}
          supplierCompany={companyPair?.supplierCompany}
          ledgerType={formData.ledgerType || "Buyer"}
          entryDate={formData.date}
          allCompaniesMode={!hasCompanyFilter}
          subtitle={
            hasCompanyFilter
              ? "Filtered view · buyer → seller"
              : "All unloaded lorries · use filters above to narrow"
          }
        />
      </div>

      <div className="flex-1">
        {fetchingEntries ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loading size="lg" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Loading entries...
            </p>
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="px-4 sm:px-6 py-6">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      {columns.map((col) => (
                        <th
                          key={col.header}
                          className="px-3 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr
                        key={entry.uiKey || entry._id}
                        className="border-b border-slate-100 hover:bg-slate-50/80"
                      >
                        {columns.map((col) => (
                          <td key={col.header} className="px-3 py-3 align-top">
                            {typeof col.accessor === "function"
                              ? col.accessor(entry, index)
                              : entry[col.accessor]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showPagination && (
                <Paginations
                  currentPage={entriesPage}
                  totalItems={entriesTotal}
                  itemsPerPage={entriesPageSize}
                  onPageChange={(page) => fetchEntries(page)}
                  showPageSize={false}
                />
              )}
            </div>

            <div className="bg-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Page unpaid (Dr.)
                  </p>
                  <p className="text-xl font-black text-white tabular-nums">
                    {formatLedgerAmount(entryStats.totalDue)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    {formData.ledgerType === "Seller"
                      ? "Sent today"
                      : "Received today"}
                  </p>
                  <p className="text-xl font-black text-white tabular-nums">
                    {formatLedgerAmount(dateTotal)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Pending on page
                  </p>
                  <p className="text-2xl font-black text-rose-400">
                    {entryStats.pendingCount}
                  </p>
                </div>
                <FaFileInvoiceDollar className="text-slate-500" size={28} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center px-8">
            <FaHistory size={32} className="text-slate-200 mb-4" />
            <h4 className="text-lg font-bold text-slate-800">No records found</h4>
            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
              {tableSearch
                ? "No matches for your search. Try different keywords or clear filters."
                : `No unloaded entries${hasCompanyFilter ? " for this filter" : ""}. Adjust filters or date range.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationLedger;
