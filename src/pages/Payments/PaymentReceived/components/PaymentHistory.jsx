import { FaHistory, FaPrint } from "react-icons/fa";
import CompanyLedgerBanner from "./CompanyLedgerBanner";
import TallyLedgerBook from "./TallyLedgerBook";
import {
  formatLedgerAmount,
  hasFullCompanyMapping,
} from "../utils/paymentLedgerUtils";
import { Suspense } from "react";
import Loading from "../../../../common/Loading/Loading";

const PaymentHistory = ({
  fetchingHistory,
  formData,
  companyPair,
  tallyRows,
  onPrintVoucher,
  sellerCompanies,
  buyerCompanies,
  onSendEmail,
  sendingEmailIds,
  sentEmailIds = new Set(),
}) => {
  const totalDebit = tallyRows.reduce((s, r) => s + (r.debit || 0), 0);
  const totalCredit = tallyRows.reduce((s, r) => s + (r.credit || 0), 0);
  const closingBalance =
    tallyRows.length > 0 ? tallyRows[tallyRows.length - 1].balance : 0;
  const fullMapping = hasFullCompanyMapping(companyPair);

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-[#ece4d2] bg-lux-ivory space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-lux-emerald to-lux-deep rounded-xl flex items-center justify-center text-lux-gold-soft shadow-sm">
              <FaHistory size={14} />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-lux-ink">
                Tally Payment Voucher Register
              </h4>
              <p className="lux-eyebrow">
                {new Date(formData.date).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
        {companyPair?.buyerCompany ? (
          <CompanyLedgerBanner
            buyerCompany={companyPair.buyerCompany}
            supplierCompany={companyPair.supplierCompany}
            mappingActive={fullMapping}
            buyerOnly={!companyPair.supplierCompany}
            subtitle={
              fullMapping
                ? `Vouchers on ${new Date(formData.date).toLocaleDateString("en-GB")} · buyer → seller`
                : `Vouchers on ${new Date(formData.date).toLocaleDateString("en-GB")} · select seller to filter`
            }
          />
        ) : null}
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <TallyLedgerBook
          rows={tallyRows.map((row) => ({
            ...row,
            buyerCompany: row.buyerCompany || companyPair?.buyerCompany,
            supplierCompany:
              row.supplierCompany || companyPair?.supplierCompany,
          }))}
          loading={fetchingHistory}
          emptyMessage="No payment vouchers recorded on the selected entry date."
          showCompanyColumns
          sellerCompanies={sellerCompanies}
          buyerCompanies={buyerCompanies}
          onSendEmail={onSendEmail}
          sendingEmailIds={sendingEmailIds}
          sentEmailIds={sentEmailIds}
        />

        {tallyRows.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-cream">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="lux-eyebrow text-lux-gold-soft/70">
                  Day debit (Dr.)
                </p>
                <p className="font-serif text-lg font-semibold text-rose-400 tabular-nums">
                  {formatLedgerAmount(totalDebit)}
                </p>
              </div>
              <div>
                <p className="lux-eyebrow text-lux-gold-soft/70">
                  Day credit (Cr.)
                </p>
                <p className="font-serif text-lg font-semibold text-emerald-400 tabular-nums">
                  {formatLedgerAmount(totalCredit)}
                </p>
              </div>
              <div>
                <p className="lux-eyebrow text-lux-gold-soft/70">
                  Closing (Dr. balance)
                </p>
                <p className="font-serif text-lg font-semibold tabular-nums">
                  {formatLedgerAmount(closingBalance)}
                </p>
              </div>
            </div>
            {onPrintVoucher && tallyRows[tallyRows.length - 1]?.raw && (
              <button
                type="button"
                onClick={() =>
                  onPrintVoucher(tallyRows[tallyRows.length - 1].raw)
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest"
              >
                <FaPrint size={12} /> Print last voucher
              </button>
            )}
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default PaymentHistory;
