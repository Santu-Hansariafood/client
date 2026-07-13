import { FaBook, FaMoneyBillWave } from "react-icons/fa";
import CompanyLedgerBanner from "./CompanyLedgerBanner";
import TallyLedgerBook from "./TallyLedgerBook";
import Paginations from "../../../../common/Paginations/Paginations";
import { formatLedgerAmount } from "../utils/paymentLedgerUtils";

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
  onEdit,
  onDelete,
  totals,
}) => {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden min-h-[360px]">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
            <FaBook size={16} />
          </div>
          <div>
            <h4 className="font-black tracking-tight text-sm sm:text-base">
              Tally Payment Voucher Register
            </h4>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Gross Amount · GST · Claims · CD · Bank Charges · Credit · Balance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
          <FaMoneyBillWave className="text-emerald-300" />
          {voucherCount} voucher{voucherCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {showCompanyBanner && (
          <CompanyLedgerBanner
            buyerCompany={listCompanyPair.buyerCompany}
            supplierCompany={listCompanyPair.supplierCompany}
            ledgerType={ledgerType}
            subtitle="Company-wise receipt & allocation mapping"
          />
        )}

        <TallyLedgerBook
          rows={tallyRows}
          loading={loading}
          showCompanyColumns
          emptyMessage={emptyMessage}
          sellerCompanies={sellerCompanies}
          buyerCompanies={buyerCompanies}
          onSendEmail={onSendEmail}
          sendingEmailIds={sendingEmailIds}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {!loading && tallyRows.length > 0 && (
          <>
            {totals && (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                    Total Bill Value
                  </p>
                  <p className="text-base font-black text-slate-900 tabular-nums mt-1">
                    {formatLedgerAmount(totals.totalBillValue)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                    Total GST
                  </p>
                  <p className="text-base font-black text-slate-900 tabular-nums mt-1">
                    {formatLedgerAmount(totals.totalGst)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                    Total Claims
                  </p>
                  <p className="text-base font-black text-slate-900 tabular-nums mt-1">
                    {formatLedgerAmount(totals.totalClaims)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                    Total CD
                  </p>
                  <p className="text-base font-black text-slate-900 tabular-nums mt-1">
                    {formatLedgerAmount(totals.totalCd)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                    Total Bank Charges
                  </p>
                  <p className="text-base font-black text-slate-900 tabular-nums mt-1">
                    {formatLedgerAmount(totals.totalBankCharges)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                    Period Receipts (Cr.)
                  </p>
                  <p className="text-base font-black text-emerald-600 tabular-nums mt-1">
                    {formatLedgerAmount(totalCredit)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Closing Balance
                </p>
                <p className="text-lg font-black tabular-nums mt-1">
                  {formatLedgerAmount(closingBalance)}
                </p>
              </div>
              <div className="sm:text-center">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Opening b/f
                </p>
                <p className="text-lg font-black tabular-nums mt-1">
                  {formatLedgerAmount(openingBalance)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Total Vouchers
                </p>
                <p className="text-lg font-black text-emerald-400 tabular-nums mt-1">
                  {voucherCount}
                </p>
              </div>
            </div>

            {total > limit && (
              <div className="pt-2 border-t border-slate-100">
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
      </div>
    </div>
  );
};

export default MisVoucherLedger;
