import { FaHistory, FaPrint } from "react-icons/fa";
import CompanyLedgerBanner from "./CompanyLedgerBanner";
import TallyLedgerBook from "./TallyLedgerBook";
import {
  formatLedgerAmount,
  hasFullCompanyMapping,
} from "../utils/paymentLedgerUtils";

const PaymentHistory = ({
  fetchingHistory,
  formData,
  companyPair,
  tallyRows,
  onPrintVoucher,
}) => {
  const totalDebit = tallyRows.reduce((s, r) => s + (r.debit || 0), 0);
  const totalCredit = tallyRows.reduce((s, r) => s + (r.credit || 0), 0);
  const closingBalance =
    tallyRows.length > 0 ? tallyRows[tallyRows.length - 1].balance : 0;
  const fullMapping = hasFullCompanyMapping(companyPair);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center text-white shadow-sm">
              <FaHistory size={14} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">
                Tally Payment Voucher Register
              </h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
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
        />

        {tallyRows.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Day debit (Dr.)
                </p>
                <p className="text-lg font-black text-rose-400 tabular-nums">
                  {formatLedgerAmount(totalDebit)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Day credit (Cr.)
                </p>
                <p className="text-lg font-black text-emerald-400 tabular-nums">
                  {formatLedgerAmount(totalCredit)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Closing (Dr. balance)
                </p>
                <p className="text-lg font-black tabular-nums">
                  {formatLedgerAmount(closingBalance)}
                </p>
              </div>
            </div>
            {onPrintVoucher && tallyRows[tallyRows.length - 1]?.raw && (
              <button
                type="button"
                onClick={() => onPrintVoucher(tallyRows[tallyRows.length - 1].raw)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest"
              >
                <FaPrint size={12} /> Print last voucher
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
