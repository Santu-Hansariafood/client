import {
  FaFilter,
  FaMoneyBillWave,
  FaHistory,
  FaFileInvoiceDollar,
  FaMagic,
  FaCloudUploadAlt,
  FaCheckCircle,
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
  fullCompanyMapping,
  hasBuyerCompany,
  hasCompanyTableScope,
  buyerOnlyMapping,
  loadingSellerOptions,
  onSelectCreditPair,
  onAutoAllocate,
  onSaveAll,
  loading,
  ledgerTopSummary = {},
}) => {
  const {
    debitEntryTotal = 0,
    creditToSeller = 0,
    debitBalanceRemaining = 0,
  } = ledgerTopSummary;
  const hasCompanyFilter =
    Boolean(formData.companyId) || Boolean(formData.opposingCompanyId);
  const showPagination =
    entriesTotal > entriesPageSize &&
    !fullCompanyMapping &&
    !buyerOnlyMapping;
  const showMappingBanner = hasBuyerCompany;

  const totalAllocated = entries.reduce((sum, e) => {
    if (!e.isSaved) return sum + (parseFloat(e.allocatedAmount) || 0);
    return sum;
  }, 0);

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
                {allocationSource === "fresh"
                  ? "Payment Received Ledger"
                  : "Advance Adjustment"}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                {allocationSource === "fresh"
                  ? fullCompanyMapping
                    ? `Payment received from ${companyPair.buyerCompany} — adjust lorry-wise to ${companyPair.supplierCompany} below`
                    : "Payment received — select seller, then adjust each lorry and Save"
                  : fullCompanyMapping
                    ? `Use advance Rs. ${(ledgerBalance.advanceBalance ?? 0).toLocaleString("en-IN")} — adjust per lorry to ${companyPair.supplierCompany}`
                    : (ledgerBalance.totalAdvanceBalance ?? 0) > 0
                      ? `Advance Rs. ${ledgerBalance.totalAdvanceBalance.toLocaleString("en-IN")} — select seller, adjust lorries`
                      : "Record advance with buyer + seller (From Advance tab)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
               <button
                type="button"
                onClick={onAutoAllocate}
                disabled={unallocatedBalance <= 0 || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  unallocatedBalance > 0 && !loading
                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-100"
                    : "bg-slate-50 text-slate-400 cursor-not-allowed"
                }`}
              >
                <FaMagic />
                Auto-Allocate
              </button>
            </div>

            {(unallocatedBalance > 0 || debitBalanceRemaining > 0) && (
              <div className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-xl shadow-lg border border-[#1e3a5f]/80">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 leading-none mb-1">
                    {allocationSource === "advance"
                      ? "Dr. left"
                      : "Unallocated"}
                  </span>
                  <span className="text-sm font-black italic tracking-tight tabular-nums">
                    Rs.{" "}
                    {(allocationSource === "advance"
                      ? unallocatedBalance
                      : debitBalanceRemaining
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
                <FaMoneyBillWave className="text-blue-200 animate-pulse" />
              </div>
            )}

            {totalAllocated > 0 && (
              <button
                type="button"
                onClick={onSaveAll}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl shadow-xl shadow-blue-200 border border-blue-500 hover:bg-blue-700 transition-all text-[11px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FaCloudUploadAlt size={16} />
                )}
                {loading ? "Saving..." : `Save All (${totalAllocated.toLocaleString("en-IN")})`}
              </button>
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

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Common date
              </span>
              <input
                type="date"
                value={formData.allocationDate || formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allocationDate: e.target.value,
                  }))
                }
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
              />
            </div>

            <SearchBox
              placeholder="Search Sauda / Lorry..."
              items={[]}
              onSearch={setTableSearch}
              returnQuery={true}
              className="!max-w-[300px]"
            />
          </div>
        </div>

        {showMappingBanner ? (
          <CompanyLedgerBanner
            buyerCompany={companyPair.buyerCompany}
            supplierCompany={companyPair.supplierCompany}
            mappingActive={fullCompanyMapping}
            buyerOnly={buyerOnlyMapping}
            debitEntryTotal={debitEntryTotal}
            creditToSeller={creditToSeller}
            debitBalanceRemaining={debitBalanceRemaining}
            allocationSource={allocationSource}
            subtitle={
              fullCompanyMapping
                ? allocationSource === "advance"
                  ? `Advance for ${companyPair.supplierCompany} — adjust each lorry below`
                  : `Payment received — adjust lorry-wise to ${companyPair.supplierCompany} below`
                : loadingSellerOptions
                  ? "Loading sellers linked to this buyer…"
                  : "Choose seller — table shows that buyer's pending lorries per seller"
            }
          />
        ) : (
          <p className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            Select a <span className="text-[#1e3a5f]">buyer company</span> to load
            linked sellers and allocate your payment entry amount.
          </p>
        )}
      </div>

      <div className="flex-1">
        {!hasCompanyTableScope ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-8">
            <h4 className="text-lg font-bold text-slate-800">
              Select company to load lorry table
            </h4>
            <p className="text-sm text-slate-500 font-medium max-w-md mt-2">
              DATE & SAUDA, LORRY, PARTIES, BREAKDOWN, ALLOCATION and ACTION
              rows appear only for your selected buyer
              {formData.ledgerType !== "Seller" ? " (and seller when chosen)" : ""}.
            </p>
          </div>
        ) : fetchingEntries ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loading size="lg" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Loading entries...
            </p>
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="px-4 sm:px-6 py-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Showing lorries for
                </span>
                {companyPair.buyerCompany && (
                  <span className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase">
                    {companyPair.buyerCompany}
                  </span>
                )}
                {companyPair.buyerCompany && companyPair.supplierCompany && (
                  <span className="text-slate-400 text-xs">→</span>
                )}
                {companyPair.supplierCompany && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase">
                    {companyPair.supplierCompany}
                  </span>
                )}
                {buyerOnlyMapping && (
                  <span className="text-[10px] font-bold text-slate-500">
                    (all sellers for this buyer)
                  </span>
                )}
              </div>
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

              {showPagination ? (
                <Paginations
                  currentPage={entriesPage}
                  totalItems={entriesTotal}
                  itemsPerPage={entriesPageSize}
                  onPageChange={(page) => fetchEntries(page)}
                  showPageSize={false}
                />
              ) : fullCompanyMapping && entries.length > 0 ? (
                <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                  {entries.length} pending line
                  {entries.length !== 1 ? "s" : ""} · adjust against entry amount
                </p>
              ) : null}
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
                    Received today
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
              {fullCompanyMapping
                ? (ledgerBalance.advanceBalance ?? 0) > 0
                  ? "Advance on account — switch to From Advance to adjust lorries, or record new payment received."
                  : "No open lorry lines for this pair. Record payment or pick another seller."
                : hasBuyerCompany
                  ? "No open lorry lines for this buyer. Select a seller to narrow, or clear date/search filters."
                  : tableSearch
                    ? "No matches for your search under selected company."
                    : "Select buyer company above to load the table."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationLedger;
