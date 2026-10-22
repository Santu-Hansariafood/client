import {
  FaFilter,
  FaMoneyBillWave,
  FaHistory,
  FaFileInvoiceDollar,
  FaCloudUploadAlt,
} from "react-icons/fa";
import SearchBox from "../../../../common/SearchBox/SearchBox";
import Loading from "../../../../common/Loading/Loading";
import Paginations from "../../../../common/Paginations/Paginations";
import DateRangeSelector from "../../../../common/DateSelector/DateRangeSelector";
import CompanyLedgerBanner from "./CompanyLedgerBanner";
import AdjustmentModeToggle from "./AdjustmentModeToggle";
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
  ledgerBalance,
  companyPair,
  fullCompanyMapping,
  hasBuyerCompany,
  hasCompanyTableScope,
  buyerOnlyMapping,
  loadingSellerOptions,
  onSaveAll,
  loading,
  ledgerTopSummary = {},
  multiAdjustmentMode = false,
  setMultiAdjustmentMode,
  selectedAllocationKeys = new Set(),
}) => {
  const {
    creditEntryTotal = 0,
    debitToSeller = 0,
    debitGstToSeller = 0,
    creditBalanceRemaining = 0,
  } = ledgerTopSummary;
  const showPagination =
    entriesTotal > entriesPageSize && !fullCompanyMapping && !buyerOnlyMapping;
  const showMappingBanner = hasBuyerCompany;

  const totalAllocated = (entries || []).reduce((sum, e) => {
    if (
      !e.isSaved &&
      (!multiAdjustmentMode || selectedAllocationKeys.has(e.uiKey))
    ) {
      return sum + (parseFloat(e.allocatedAmount) || 0);
    }
    return sum;
  }, 0);

  if (!formData) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-[#ece4d2] bg-lux-ivory flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-lux-emerald to-lux-deep rounded-xl flex items-center justify-center text-lux-gold-soft shadow-sm">
              <FaFilter size={14} />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-lux-ink flex items-center gap-2 flex-wrap">
                {allocationSource === "fresh"
                  ? "Payment Received (Cr.) Ledger"
                  : "Advance Adjustment (Dr.)"}
              </h4>
              <p className="lux-eyebrow">
                {allocationSource === "fresh"
                  ? fullCompanyMapping
                    ? `credited balance from ${companyPair.buyerCompany} — adjust each lorry (Dr.) to ${companyPair.supplierCompany} below`
                    : "credited balance — select seller, then adjust each lorry (Dr.) and Save"
                  : fullCompanyMapping
                    ? `Use advance (Cr.) Rs. ${(ledgerBalance.advanceBalance ?? 0).toLocaleString("en-IN")} — adjust per lorry (Dr.) to ${companyPair.supplierCompany}`
                    : (ledgerBalance.totalAdvanceBalance ?? 0) > 0
                      ? `Advance (Cr.) Rs. ${ledgerBalance.totalAdvanceBalance.toLocaleString("en-IN")} — select seller, adjust lorries (Dr.)`
                      : "Record advance (Cr.) with buyer + seller (From Advance tab)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AdjustmentModeToggle
              enabled={multiAdjustmentMode}
              selectedCount={selectedAllocationKeys.size}
              onChange={setMultiAdjustmentMode}
            />
            <div className="flex items-center gap-2 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-cream px-4 py-2 rounded-xl shadow-lg ring-1 ring-lux-gold/30">
              <div className="flex flex-col">
                <span className="lux-eyebrow text-lux-gold-soft leading-none mb-1">
                  {allocationSource === "advance"
                    ? "Cr. left"
                    : "Cr. Remaining"}
                </span>
                <span className="font-serif font-semibold text-sm tracking-tight tabular-nums">
                  Rs.{" "}
                  {Math.abs(
                    allocationSource === "advance"
                      ? unallocatedBalance
                      : creditBalanceRemaining,
                  ).toLocaleString("en-IN")}
                </span>
              </div>
              <FaMoneyBillWave className="text-lux-gold-soft" />
            </div>

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
              className="!bg-lux-cream !px-3 !py-1.5 shadow-sm"
            />

            <div className="flex items-center gap-2 bg-lux-cream border border-[#e4dbc6] rounded-xl px-3 py-1.5 shadow-sm">
              <span className="lux-eyebrow whitespace-nowrap">
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
                className="h-8 px-2 rounded-lg border border-[#e4dbc6] bg-lux-cream text-xs font-bold text-lux-ink outline-none focus:border-lux-gold focus:ring-2 focus:ring-lux-gold/20"
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
            creditEntryTotal={creditEntryTotal}
            debitToSeller={debitToSeller}
            creditBalanceRemaining={creditBalanceRemaining}
            allocationSource={allocationSource}
            subtitle={
              fullCompanyMapping
                ? allocationSource === "advance"
                  ? `Advance for ${companyPair.supplierCompany} — adjust each lorry (Dr.) below`
                  : `credited balance (Cr.) — adjust each lorry (Dr.) to ${companyPair.supplierCompany} below`
                : loadingSellerOptions
                  ? "Loading sellers linked to this buyer…"
                  : "Choose seller — table shows that buyer's pending lorries per seller"
            }
          />
        ) : (
          <p className="text-[11px] font-bold text-lux-muted bg-lux-ivory border border-[#ece4d2] rounded-xl px-4 py-3">
            Select a <span className="text-lux-emerald">buyer company</span> to
            load linked sellers and allocate your payment entry amount.
          </p>
        )}
      </div>

      <div className="flex-1">
        {!hasCompanyTableScope ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-8">
            <h4 className="font-serif text-lg font-semibold text-lux-ink">
              Select company to load lorry table
            </h4>
            <p className="text-sm text-lux-muted font-medium max-w-md mt-2">
              DATE & SAUDA, LORRY, PARTIES, BREAKDOWN, ALLOCATION and ACTION
              rows appear only for your selected buyer
              {formData.ledgerType !== "Seller"
                ? " (and seller when chosen)"
                : ""}
              .
            </p>
          </div>
        ) : fetchingEntries ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loading size="lg" />
            <p className="lux-eyebrow">
              Loading entries...
            </p>
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="px-4 sm:px-6 py-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="lux-eyebrow">
                  Showing lorries for
                </span>
                {companyPair.buyerCompany && (
                  <span className="px-2 py-1 rounded-lg bg-lux-emerald text-lux-cream text-[10px] font-black uppercase">
                    {companyPair.buyerCompany}
                  </span>
                )}
                {companyPair.buyerCompany && companyPair.supplierCompany && (
                  <span className="text-lux-muted text-xs">→</span>
                )}
                {companyPair.supplierCompany && (
                  <span className="px-2 py-1 rounded-lg bg-lux-gold text-lux-deep text-[10px] font-black uppercase">
                    {companyPair.supplierCompany}
                  </span>
                )}
                <div className="h-4 w-px bg-[#e4dbc6] mx-1 hidden sm:block" />
                <span className="lux-eyebrow">
                  Cr. Remaining:
                </span>
                <span className="px-2 py-1 rounded-lg bg-lux-ivory text-lux-ink text-[10px] font-black tabular-nums border border-[#e4dbc6]">
                  Rs.{" "}
                  {Math.abs(creditEntryTotal - debitToSeller).toLocaleString(
                    "en-IN",
                  )}
                </span>
                {buyerOnlyMapping && (
                  <span className="text-[10px] font-bold text-lux-muted">
                    (all sellers for this buyer)
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#ece4d2]">
                <table className="w-full border-collapse text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald border-b border-lux-emerald/40">
                      {columns.map((col) => (
                        <th
                          key={col.header}
                          className="px-3 py-2.5 text-[10px] font-serif font-semibold text-lux-gold-soft uppercase tracking-wider"
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
                        className="border-b border-[#ece4d2] odd:bg-lux-cream even:bg-[#f2eee2]/50 hover:bg-lux-ivory"
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
                <p className="mt-4 text-[10px] font-bold text-lux-muted uppercase tracking-widest text-center">
                  {entries.length} pending line
                  {entries.length !== 1 ? "s" : ""} · adjust against entry
                  amount
                </p>
              ) : null}
            </div>

            <div className="bg-gradient-to-br from-lux-emerald via-lux-deep to-lux-night p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-lux-cream/10 shadow-2xl">
              <div className="flex flex-wrap items-center gap-8 lg:gap-16">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                    <p className="lux-eyebrow text-emerald-400">
                      Payment Credit (Cr.)
                    </p>
                  </div>
                  <p className="font-serif text-2xl font-semibold text-lux-cream tabular-nums tracking-tight">
                    {formatLedgerAmount(creditEntryTotal)}
                  </p>
                  <p className="text-[8px] font-bold text-lux-cream/40 uppercase tracking-tighter">
                    GST excluded · debit side only
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-lux-gold shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                    <p className="lux-eyebrow text-lux-gold">
                      GST (Dr.)
                    </p>
                  </div>
                  <p className="font-serif text-2xl font-semibold tracking-tight text-lux-gold-soft tabular-nums">
                    {formatLedgerAmount(debitGstToSeller)}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-tighter text-lux-cream/40">
                    Included in lorry bill
                  </p>
                </div>

                <div className="text-lux-cream/20 text-3xl font-thin hidden lg:block">
                  /
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                    <p className="lux-eyebrow text-rose-300">
                      Lorry Bill (Dr.)
                    </p>
                  </div>
                  <p className="font-serif text-2xl font-semibold text-lux-cream tabular-nums tracking-tight">
                    {formatLedgerAmount(debitToSeller)}
                  </p>
                  <p className="text-[8px] font-bold text-lux-cream/40 uppercase tracking-tighter">
                    Total Due Amount (Dr.)
                  </p>
                </div>

                <div className="h-12 w-px bg-lux-cream/10 hidden md:block"></div>

                <div className="flex flex-col gap-1">
                  <p className="lux-eyebrow text-lux-gold-soft/70">
                    Closing Balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p
                      className={`font-serif text-2xl font-semibold tabular-nums tracking-tight ${
                        creditBalanceRemaining > 0.01
                          ? "text-emerald-400"
                          : "text-lux-cream/60"
                      }`}
                    >
                      {formatLedgerAmount(creditBalanceRemaining)}
                    </p>
                    <span className="text-[10px] font-black text-lux-gold-soft/60 uppercase">
                      {creditBalanceRemaining > 0.01 ? "Cr." : "Balanced"}
                    </span>
                  </div>
                  <p className="text-[8px] font-bold text-lux-cream/40 uppercase tracking-tighter">
                    Unallocated Credit Remaining
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-lux-cream/5 p-4 rounded-2xl border border-lux-cream/10 backdrop-blur-sm">
                {(multiAdjustmentMode || totalAllocated > 0) && (
                  <button
                    type="button"
                    onClick={onSaveAll}
                    disabled={loading || totalAllocated <= 0}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-6 py-3 text-[11px] font-black uppercase tracking-widest text-lux-gold-soft shadow-xl shadow-lux-emerald/40 ring-1 ring-lux-gold/30 transition-all hover:from-lux-deep hover:to-lux-night disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loading /> : <FaCloudUploadAlt size={16} />}
                    {loading
                      ? "Saving..."
                      : totalAllocated > 0
                        ? `Save All (Rs. ${totalAllocated.toLocaleString("en-IN")})`
                        : "Select rows and enter amounts"}
                  </button>
                )}
                <div className="text-right">
                  <p className="text-[9px] font-black text-lux-cream/50 uppercase tracking-widest mb-1">
                    Pending Lines
                  </p>
                  <p className="font-serif text-3xl font-semibold text-rose-300 tabular-nums">
                    {entryStats.pendingCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-lux-cream/10 rounded-xl flex items-center justify-center text-lux-cream/60">
                  <FaFileInvoiceDollar size={24} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center px-8">
            <FaHistory size={32} className="text-lux-muted/40 mb-4" />
            <h4 className="font-serif text-lg font-semibold text-lux-ink">
              No records found
            </h4>
            <p className="text-sm text-lux-muted font-medium max-w-xs mx-auto mt-2">
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
