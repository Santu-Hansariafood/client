import {
  FaBook,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";
import { lazy, Suspense } from "react";
import Loading from "../../../../common/Loading/Loading";
const CompanyLedgerBanner = lazy(() => import("./CompanyLedgerBanner"));
const TallyLedgerBook = lazy(() => import("./TallyLedgerBook"));
const Paginations = lazy(
  () => import("../../../../common/Paginations/Paginations"),
);

const SkeletonRow = ({ cols = 12 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-3 border-r border-slate-100">
        <div className="h-3 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded animate-pulse bg-[length:200%_100%]" />
      </td>
    ))}
  </tr>
);

const SkeletonStatCell = () => (
  <div className="space-y-1.5">
    <div className="h-2 w-20 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded animate-pulse bg-[length:200%_100%]" />
    <div className="h-4 w-24 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded animate-pulse bg-[length:200%_100%]" />
  </div>
);

const MisVoucherLedger = ({
  loading,
  tallyRows,
  listCompanyPair,
  ledgerType,
  showCompanyBanner,
  totalCredit,
  closingBalance,
  openingBalance,
  voucherCount,
  page,
  total,
  limit,
  onPageChange,
  emptyMessage,
  sellerCompanies = [],
  buyerCompanies = [],
  onSendEmail,
  sendingEmailIds = new Set(),
  sentEmailIds = new Set(),
  onEdit,
  onDelete,
  totals,
}) => {
  const showPagination = !loading && total > limit && tallyRows.length > 0;
  const hasData = !loading && tallyRows.length > 0;

  return (
    <Suspense fallback={<Loading />}>
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.07)]">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-900 via-[#0f2a45] to-[#1e3a5f] text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/3 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-amber-400/20 blur-2xl" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/30 rounded-xl blur-md" />
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-[#d97706] flex items-center justify-center shadow-lg shadow-amber-500/20 border border-white/15">
                  <FaBook className="text-slate-950" size={18} />
                </div>
              </div>
              <div>
                <h4 className="font-black tracking-tight text-base sm:text-lg lg:text-xl leading-tight">
                  Tally Payment Voucher Register
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    <FaFileInvoiceDollar
                      size={9}
                      className="text-emerald-300"
                    />
                    Due Amount
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    <FaMoneyBillWave size={9} className="text-emerald-300" />
                    Credit
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    <FaCalendarAlt size={9} className="text-amber-300" />
                    Balance
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 sm:px-4 py-2 rounded-xl border border-white/15 backdrop-blur-sm">
                <FaMoneyBillWave className="text-emerald-300" size={12} />
                <span>
                  <span className="text-white">{voucherCount}</span>
                  <span className="text-white/60 ml-1">
                    voucher{voucherCount !== 1 ? "s" : ""}
                  </span>
                </span>
              </div>
              {!loading && (
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 px-3 sm:px-4 py-2 rounded-xl border border-emerald-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Ready</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
          {showCompanyBanner && (
            <CompanyLedgerBanner
              buyerCompany={listCompanyPair.buyerCompany}
              supplierCompany={listCompanyPair.supplierCompany}
              ledgerType={ledgerType}
              subtitle="Company-wise receipt & allocation mapping"
            />
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <th
                          key={i}
                          className="px-3 py-3 border-r border-slate-200"
                        >
                          <div className="h-2.5 w-16 bg-slate-200/80 rounded" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonRow key={i} cols={12} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonStatCell key={i} />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2.5 w-24 bg-white/10 rounded animate-pulse" />
                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <TallyLedgerBook
                rows={tallyRows}
                loading={loading}
                showCompanyColumns
                emptyMessage={emptyMessage}
                sellerCompanies={sellerCompanies}
                buyerCompanies={buyerCompanies}
                onSendEmail={onSendEmail}
                sendingEmailIds={sendingEmailIds}
                sentEmailIds={sentEmailIds}
                onEdit={onEdit}
                onDelete={onDelete}
              />

              {hasData && (
                <>
                  {totals && (
                    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-5 shadow-inner">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1e3a5f] via-[#047857] to-amber-500" />
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-[0.15em]">
                              Total Bill Value
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-slate-900 tabular-nums tracking-tight">
                            {formatLedgerAmount(totals.totalBillValue)}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-[0.15em]">
                              Total GST
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-blue-800 tabular-nums tracking-tight">
                            {formatLedgerAmount(totals.totalGst)}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-[0.15em]">
                              Total Claims
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-rose-800 tabular-nums tracking-tight">
                            {formatLedgerAmount(totals.totalClaims)}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-[0.15em]">
                              Total CD
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-amber-800 tabular-nums tracking-tight">
                            {formatLedgerAmount(totals.totalCd)}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-[0.15em]">
                              Total Bank Charges
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-purple-800 tabular-nums tracking-tight">
                            {formatLedgerAmount(totals.totalBankCharges)}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-700 tracking-[0.15em]">
                              Period Receipts (Cr.)
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-emerald-700 tabular-nums tracking-tight">
                            {formatLedgerAmount(totalCredit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 bg-gradient-to-br from-slate-950 via-[#0f2a45] to-slate-900 text-white shadow-[0_4px_20px_rgba(15,23,42,0.2)]">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" />

                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-[#047857] to-emerald-400" />

                    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <div className="relative p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-[#d97706] flex items-center justify-center">
                            <FaMoneyBillWave
                              size={11}
                              className="text-slate-950"
                            />
                          </div>
                          <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-300 tracking-[0.18em]">
                            Closing Balance
                          </p>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight text-white">
                          {formatLedgerAmount(closingBalance)}
                        </p>
                      </div>

                      <div className="relative p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm sm:text-center">
                        <div className="flex items-center justify-start sm:justify-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
                            <FaCalendarAlt size={11} className="text-white" />
                          </div>
                          <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-300 tracking-[0.18em]">
                            Opening b/f
                          </p>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight text-blue-200">
                          {formatLedgerAmount(openingBalance)}
                        </p>
                      </div>

                      <div className="relative p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm sm:text-right">
                        <div className="flex items-center justify-start sm:justify-end gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-[#065f46] flex items-center justify-center">
                            <FaFileInvoiceDollar
                              size={11}
                              className="text-white"
                            />
                          </div>
                          <p className="text-[10px] sm:text-[11px] font-black uppercase text-emerald-300 tracking-[0.18em]">
                            Total Vouchers
                          </p>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight text-emerald-300">
                          {voucherCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {showPagination && (
                    <div className="pt-3 border-t border-slate-100">
                      <Paginations
                        currentPage={page}
                        totalItems={total}
                        itemsPerPage={limit}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default MisVoucherLedger;
