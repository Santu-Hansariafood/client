import { formatLedgerAmount } from "../utils/paymentLedgerUtils";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FaEnvelope, FaFilePdf, FaEdit, FaTrash, FaCheck, FaBook } from "react-icons/fa";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import PaymentVoucherPDF from "./PaymentVoucherPDF";
import Loading from "../../../../common/Loading/Loading";

const TallyLedgerBook = ({
  rows = [],
  loading = false,
  emptyMessage = "No ledger entries for this company mapping.",
  showCompanyColumns = true,
  footer,
  sellerCompanies = [],
  buyerCompanies = [],
  onSendEmail,
  sendingEmailIds = new Set(),
  sentEmailIds = new Set(),
  onEdit,
  onDelete,
}) => {
  const [qrCache, setQrCache] = useState({});
  const [qrLoading, setQrLoading] = useState({});

  const normalizeValue = (value) => String(value || "").trim().toLowerCase();

  const getCompanyName = (company) =>
    company?.companyName || company?.name || "";

  const getEmailValue = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item : item?.value || item?.email))
        .filter(Boolean)
        .join(", ");
    }
    return typeof value === "string" ? value.trim() : "";
  };

  const resolveRecipientEmail = (row, sellerCompany) => {
    const raw = row.raw || {};
    const loadingEntry = raw.mappings?.[0]?.loadingEntryId || {};
    const emailCandidates = [
      sellerCompany?.email,
      sellerCompany?.companyEmail,
      raw.supplierEmail,
      raw.sellerEmail,
      raw.supplierCompany?.email,
      raw.sellerCompany?.email,
      loadingEntry.supplierEmail,
      loadingEntry.sellerEmail,
    ];

    return emailCandidates.map(getEmailValue).find(Boolean) || "";
  };

  const resolveVoucherNumber = (row) =>
    row.raw?.voucherNumber || row.raw?.voucherNo || row.voucherNo || row.id || "-";

  const buildVoucherFileName = (row) =>
    `Payment_Voucher_${(row.buyerCompany || "Buyer").replace(/[^a-zA-Z0-9]/g, "_")}_${(row.supplierCompany || "Seller").replace(/[^a-zA-Z0-9]/g, "_")}_${row.date ? new Date(row.date).toISOString().split("T")[0] : "undated"}.pdf`;

  const generateQRCode = async (row, voucherNumber) => {
    const getValue = (...candidates) => {
      for (const value of candidates) {
        if (
          value &&
          String(value).trim() !== "" &&
          String(value).trim() !== "N/A"
        ) {
          return String(value).trim();
        }
      }
      return "-";
    };

    const firstMapping = row.raw?.mappings?.[0];
    const loadingEntry = firstMapping?.loadingEntryId;
    const billNo = getValue(
      loadingEntry?.billNumber,
      row.raw?.billNo,
      row.raw?.billNumber,
      row.billNo,
    );
    const saudaNo = getValue(
      firstMapping?.saudaNo,
      loadingEntry?.saudaNo,
      row.raw?.saudaNo,
      row.saudaNo,
    );
    const lorryNo = getValue(
      loadingEntry?.lorryNumber,
      row.raw?.lorryNumber,
      row.lorryNo,
    );

    const totalAmount = Math.max(
      Number(row.debit || 0),
      Number(row.credit || 0),
    );
    const qrText = [
      "HANSARIA FOOD PRIVATE LIMITED",
      `Date: ${row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-"}`,
      `Voucher No: ${voucherNumber || row.raw?.voucherNo || row.id || "-"}`,
      `Buyer: ${row.buyerCompany || "-"}`,
      `Seller: ${row.supplierCompany || "-"}`,
      `Sauda No: ${saudaNo}`,
      `Lorry No: ${lorryNo}`,
      `Bill No: ${billNo}`,
      `Amount: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ].join("\n");

    const qrDataUrl = await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return qrDataUrl;
  };

  const handleDownloadClick = async (row, buyerCompany, sellerCompany) => {
    if (qrLoading[row.id]) {
      return;
    }

    setQrLoading((prev) => ({ ...prev, [row.id]: true }));
    try {
      const voucherNumber = resolveVoucherNumber(row);
      let qrUrl = qrCache[row.id];

      if (!qrUrl) {
        qrUrl = await generateQRCode(row, voucherNumber);
        setQrCache((prev) => ({ ...prev, [row.id]: qrUrl }));
      }

      const blob = await pdf(
        <PaymentVoucherPDF
          row={row}
          buyerCompany={buyerCompany}
          sellerCompany={sellerCompany}
          qrCodeUrl={qrUrl}
          voucherNumber={voucherNumber}
        />,
      ).toBlob();

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = buildVoucherFileName(row);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading voucher PDF:", error);
      toast.error("Failed to download voucher PDF");
    } finally {
      setQrLoading((prev) => ({ ...prev, [row.id]: false }));
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!rows.length) {
    return (
      <div className="relative py-20 sm:py-24 px-6 text-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 mb-4 shadow-inner">
          <FaBook size={26} className="text-slate-400" />
        </div>
        <h4 className="text-lg font-black text-slate-700 mb-1.5 tracking-tight">
          No ledger entries found
        </h4>
        <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const renderAmountCells = (r) => {
    const hasDebit = Number(r.debit || 0) > 0;
    const hasCredit = Number(r.credit || 0) > 0;
    const balanceVal = Number(r.balance || 0);
    const isBalanceDr = balanceVal > 0;
    const isBalanceCr = balanceVal < 0;
    return (
      <>
        <td
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right font-black tabular-nums border-r border-slate-100 ${
            hasDebit
              ? "bg-gradient-to-r from-blue-50/40 to-transparent text-[#172d4f]"
              : "text-slate-400"
          }`}
        >
          {hasDebit ? (
            <span className="inline-flex flex-col items-end">
              <span>{formatLedgerAmount(r.debit)}</span>
            </span>
          ) : (
            <span className="opacity-30">—</span>
          )}
        </td>
        <td
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right font-black tabular-nums border-r border-slate-100 ${
            hasCredit
              ? "bg-gradient-to-r from-emerald-50/50 to-transparent text-[#065f46]"
              : "text-slate-400"
          }`}
        >
          {hasCredit ? (
            <span className="inline-flex items-end gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mb-1.5" />
              <span>{formatLedgerAmount(r.credit)}</span>
            </span>
          ) : (
            <span className="opacity-30">—</span>
          )}
        </td>
        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-bold tabular-nums border-r border-slate-100">
          {balanceVal !== 0 ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border font-black tracking-tight ${
                isBalanceDr
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBalanceDr ? "bg-blue-500" : "bg-emerald-500"
                }`}
              />
              <span>{formatLedgerAmount(Math.abs(balanceVal))}</span>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-80">
                {isBalanceDr ? "Dr" : "Cr"}
              </span>
            </span>
          ) : (
            <span className="text-slate-300 font-medium">—</span>
          )}
        </td>
      </>
    );
  };

  const handleSendClick = (row, buyerCompany, sellerCompany) => {
    if (onSendEmail) {
      onSendEmail({
        row,
        buyerCompany,
        sellerCompany,
        recipientEmail: resolveRecipientEmail(row, sellerCompany),
        voucherNumber: resolveVoucherNumber(row),
      });
    }
  };

  const renderActionCells = (row, buyerCompany, sellerCompany) => {
    const recipientEmail = resolveRecipientEmail(row, sellerCompany);
    const canShowVoucherActions = row.isPrimaryPaymentMapping !== false;
    const hasEmailTarget = Boolean(recipientEmail && onSendEmail);
    const isVoucherRow = row.isPaymentRow || row.raw?.uiType !== "entry";
    const isSending = sendingEmailIds.has(row.id);
    const isEmailSent = row.emailSent || sentEmailIds.has(row.id);
    const sentAtDate = row.emailSentAt;
    const canSendViaIcon = !row.isOpening && hasEmailTarget;
    return (
    <>
      <td className="px-3 py-2.5 text-center border-r border-slate-200">
        {!row.isOpening && canShowVoucherActions && (
          <button
            onClick={() => handleDownloadClick(row, buyerCompany, sellerCompany)}
            disabled={qrLoading[row.id]}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download voucher PDF"
          >
            {qrLoading[row.id] ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Prep
              </>
            ) : (
              <>
                <FaFilePdf size={11} />
                PDF
              </>
            )}
          </button>
        )}
      </td>
      <td className="px-3 py-2.5 border-r border-slate-200">
        <div className="flex flex-col items-center justify-center gap-1.5">
          {canShowVoucherActions && (
            <div className="flex items-center justify-center gap-1.5 w-full max-w-[240px]">
              <span className="flex-1 truncate text-[10px] font-semibold text-slate-600 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 max-w-[160px]" title={recipientEmail}>
                {recipientEmail || "—"}
              </span>
              {canSendViaIcon && (
                <button
                  type="button"
                  onClick={() => handleSendClick(row, buyerCompany, sellerCompany)}
                  disabled={isSending}
                  aria-label={isEmailSent
                    ? `Re-send voucher PDF to ${recipientEmail}`
                    : `Send voucher PDF to ${recipientEmail}`}
                  title={isEmailSent
                    ? `Already sent${sentAtDate ? ` on ${new Date(sentAtDate).toLocaleString("en-GB")}` : ""} — click to re-send voucher PDF to ${recipientEmail}`
                    : `Click to send voucher PDF to ${recipientEmail}`}
                  className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-xl text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isEmailSent
                      ? "bg-gradient-to-b from-emerald-500 to-[#047857] shadow-emerald-500/20 hover:shadow-emerald-500/35"
                      : "bg-gradient-to-b from-indigo-500 to-violet-600 shadow-indigo-500/20 hover:shadow-indigo-500/35"
                  }`}
                >
                  {isSending ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : (
                    <FaEnvelope size={11} />
                  )}
                </button>
              )}
            </div>
          )}
          {canShowVoucherActions && (
            <div className="flex items-center justify-center min-h-[30px]">
              {!row.isOpening && isVoucherRow && hasEmailTarget && (
                isEmailSent ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-emerald-500 to-[#047857] text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/20"
                    title={sentAtDate ? `Sent on ${new Date(sentAtDate).toLocaleString("en-GB")}` : "Email sent successfully"}
                  >
                    <FaCheck size={9} />
                    Sent
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendClick(row, buyerCompany, sellerCompany)}
                    disabled={isSending}
                    aria-label={`Send voucher to ${recipientEmail}`}
                    title={`Send voucher PDF to ${recipientEmail} using the payment email`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-500/15 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      <FaEnvelope size={9} />
                    )}
                    {isSending ? "Sending" : "Send"}
                  </button>
                )
              )}
              {!row.isOpening && isVoucherRow && !hasEmailTarget && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  No Email
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center border-r border-slate-200">
        {!row.isOpening && canShowVoucherActions && row.raw && onEdit && (
          <button
            onClick={() => onEdit(row.raw)}
            className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-b from-emerald-500 to-[#065f46] hover:from-emerald-600 hover:to-[#047857] text-white rounded-xl text-xs font-black transition-all duration-200 shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
            title="Edit payment voucher"
          >
            <FaEdit size={12} />
          </button>
        )}
      </td>
      <td className="px-3 py-2.5 text-center">
        {!row.isOpening && canShowVoucherActions && row.raw && onDelete && (
          <button
            onClick={() => onDelete(row.raw._id)}
            className="group inline-flex items-center justify-center w-8 h-8 bg-gradient-to-b from-rose-500 to-red-700 hover:from-rose-600 hover:to-red-800 text-white rounded-xl text-xs font-black transition-all duration-200 shadow-md shadow-rose-500/15 hover:shadow-lg hover:shadow-rose-500/25 active:scale-95"
            title="Delete payment voucher"
          >
            <FaTrash size={12} />
          </button>
        )}
      </td>
    </>
  );
  };

  const renderEmptyAmountCells = (count = 2) =>
    Array.from({ length: count }).map((_, i) => (
      <td key={`e-${i}`} className="px-3 py-1 border-r border-slate-200"></td>
    ));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#065f46] via-[#047857] to-amber-500" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1350px] border-collapse text-left">
          <thead>
            <tr className="bg-gradient-to-r from-slate-900 via-[#0f2a45] to-[#1e3a5f] text-white">
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[105px] sticky left-0 bg-[#0f2a45] z-10">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Date
                </span>
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 min-w-[280px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Particulars
                </span>
              </th>
              {showCompanyColumns && (
                <>
                  <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[130px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                      Buyer Co.
                    </span>
                  </th>
                  <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[130px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      Seller Co.
                    </span>
                  </th>
                </>
              )}
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[75px] text-center">
                Vch
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[110px] text-right">
                <span className="text-blue-200">Debit (Dr.)</span>
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[110px] text-right">
                <span className="text-emerald-300">Credit (Cr.)</span>
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[115px] text-right">
                Balance
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[95px] text-center">
                <FaFilePdf size={10} className="inline mr-1.5 text-blue-300" />
                Down
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[230px] text-center">
                <FaEnvelope size={10} className="inline mr-1.5 text-indigo-300" />
                Recipient Email
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] border-r border-white/10 w-[70px] text-center">
                Edit
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] w-[70px] text-center">
                Del
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const breakdown = row.breakdown || [];
              const paymentAllocations = row.paymentAllocations || [];
              const hasBreakdown = breakdown.length > 0;
              const hasPaymentAllocations = paymentAllocations.length > 0;

              const buyerCompany = buyerCompanies.find(
                (c) =>
                  normalizeValue(c.companyName) ===
                  normalizeValue(row.buyerCompany),
              );
              const sellerCompany = sellerCompanies.find(
                (c) =>
                  normalizeValue(getCompanyName(c)) ===
                  normalizeValue(row.supplierCompany),
              );

              const baseRowClass = [
                "group border-b border-slate-100 text-[11px] transition-colors duration-150",
                row.isOpening
                  ? "bg-gradient-to-r from-emerald-50/90 via-green-50/70 to-emerald-50/90 font-bold"
                  : row.raw?.uiType === "entry" && row.raw?.isRejected
                    ? "bg-gradient-to-r from-red-50 via-rose-50/80 to-red-50 text-red-700 border-b-2 border-red-200/70"
                  : idx % 2 === 0
                    ? "bg-white hover:bg-gradient-to-r hover:from-sky-50/40 hover:via-sky-50/20 hover:to-sky-50/40"
                    : "bg-gradient-to-r from-slate-50/30 via-white to-slate-50/30 hover:from-sky-50/40 hover:via-sky-50/20 hover:to-sky-50/40",
              ].join(" ");

              const subRowBg = idx % 2 === 0 ? "bg-amber-50/30" : "bg-slate-50/40";
              const displayDate = row.unloadingDate || row.date;

              return (
                <>
                  <tr key={`m-${row.id || idx}`} className={baseRowClass}>
                    <td className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap sticky left-0 z-[1] ${row.isOpening ? "bg-gradient-to-r from-emerald-50/95 via-green-50/80 to-emerald-50/95" : row.raw?.isRejected ? "bg-rose-50" : idx % 2 === 0 ? "bg-white group-hover:bg-sky-50/40" : "bg-slate-50/30 group-hover:bg-sky-50/40"}`}>
                      {displayDate
                        ? new Date(displayDate).toLocaleDateString("en-GB")
                        : "—"}
                      {row.unloadingDate &&
                        row.loadingDate &&
                        row.unloadingDate !== row.loadingDate && (
                          <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-slate-400" />
                              Load:{" "}
                              {new Date(row.loadingDate).toLocaleDateString(
                                "en-GB",
                              )}
                            </span>
                          </div>
                        )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 border-r border-slate-100 leading-snug max-w-md">
                      <div
                        className={`font-bold uppercase tracking-wide text-[10.5px] ${row.raw?.uiType === "entry" && row.raw?.isRejected ? "text-red-700" : row.isOpening ? "text-emerald-800" : "text-slate-800"}`}
                      >
                        {row.particulars}
                        {row.raw?.uiType === "entry" && row.raw?.isRejected && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 border border-red-200 text-red-700 text-[8.5px] font-black uppercase tracking-wider">
                            Rejected
                          </span>
                        )}
                      </div>
                      {row.reference && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-[9px] font-black text-amber-800 uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          {row.reference}
                        </div>
                      )}
                      {row.isPaymentRow && row.voucherNo && (
                        <div className="text-[9.5px] font-bold text-indigo-700 mt-1 inline-flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Vch #{row.voucherNo}
                          {row.paymentMode ? ` · ${row.paymentMode}` : ""}
                        </div>
                      )}
                      {row.raw?.uiType === "entry" && row.weight > 0 && (
                        <div className="text-[9.5px] font-bold text-emerald-700 mt-1 inline-flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {row.isUnloading ? "Unloaded" : "Loaded"}:{" "}
                          <span className="tabular-nums">{Number(row.weight).toFixed(3)}T</span>
                          {" @ "}
                          <span className="tabular-nums">₹{Number(row.rate).toFixed(2)}</span>
                          {row.billNumber ? (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-black">
                              Bill {row.billNumber}
                            </span>
                          ) : ""}
                        </div>
                      )}
                      {(row.generalRemarks || row.remarks) && (
                        <div className="text-[9px] italic text-slate-500 mt-1 pl-2 border-l-2 border-slate-200">
                          {row.generalRemarks || row.remarks}
                        </div>
                      )}
                    </td>
                    {showCompanyColumns && (
                      <>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] font-bold text-slate-600 uppercase border-r border-slate-100 truncate max-w-[130px]">
                          <span className="inline-block px-2 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 truncate max-w-full">
                            {row.buyerCompany || "—"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] font-bold text-slate-600 uppercase border-r border-slate-100 truncate max-w-[130px]">
                          <span className="inline-block px-2 py-1 rounded-md bg-purple-50 border border-purple-100 text-purple-700 truncate max-w-full">
                            {row.supplierCompany || "—"}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 border-r border-slate-100 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                          row.vchType === "Bill"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : row.vchType === "PYT" || row.vchType === "CR"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : row.vchType === "BRK"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {row.vchType}
                      </span>
                    </td>
                    {renderAmountCells(row)}
                    {renderActionCells(row, buyerCompany, sellerCompany)}
                  </tr>

                {hasBreakdown &&
                  breakdown.map((item, bIdx) => {
                    return (
                      <tr
                        key={`b-${row.id}-${bIdx}`}
                        className={[
                          "border-b border-slate-100 text-[10px]",
                          subRowBg,
                        ].join(" ")}
                      >
                        <td className="px-3 py-1 border-r border-slate-200"></td>
                        <td
                          className={[
                            "px-3 py-1 border-r border-slate-200 leading-snug max-w-md font-medium italic",
                            item.type === "add"
                              ? "text-emerald-700"
                              : "text-rose-700",
                          ].join(" ")}
                        >
                          <span className="inline-block mr-2 font-bold w-4 text-right">
                            {item.type === "add" ? "+" : "−"}
                          </span>
                          {item.label}
                        </td>
                        {showCompanyColumns && (
                          <>
                            <td className="px-3 py-1 border-r border-slate-200"></td>
                            <td className="px-3 py-1 border-r border-slate-200"></td>
                          </>
                        )}
                        <td className="px-3 py-1 border-r border-slate-200 text-[9px] font-bold text-slate-400 uppercase text-right">
                          BRK
                        </td>
                        <td className="px-3 py-1 text-right font-bold tabular-nums border-r border-slate-200 text-[#1e3a5f]">
                          {item.type === "add" && (
                            formatLedgerAmount(item.amount)
                          )}
                        </td>
                        <td className="px-3 py-1 text-right font-bold tabular-nums border-r border-slate-200 text-emerald-700">
                          {item.type === "deduct" && (
                            formatLedgerAmount(item.amount)
                          )}
                        </td>
                        <td className="px-3 py-1"></td>
                        <td className="px-3 py-1"></td>
                        <td className="px-3 py-1"></td>
                        <td className="px-3 py-1"></td>
                        <td className="px-3 py-1"></td>
                      </tr>
                    );
                  })}

                {hasPaymentAllocations &&
                  paymentAllocations.map((alloc, aIdx) => (
                    <tr
                      key={`a-${row.id}-${aIdx}`}
                      className={[
                        "border-b border-slate-100 text-[10px]",
                        idx % 2 === 0 ? "bg-emerald-50/30" : "bg-slate-50/30",
                      ].join(" ")}
                    >
                      <td className="px-3 py-1 border-r border-slate-200 font-semibold text-emerald-700 whitespace-nowrap">
                        {alloc.paymentDate
                          ? new Date(alloc.paymentDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "—"}
                      </td>
                      <td className="px-3 py-1 text-slate-700 border-r border-slate-200 leading-snug max-w-md italic font-medium">
                        <span className="inline-block mr-2 font-black text-emerald-600 w-4 text-right">
                          ←
                        </span>
                        Part Payment
                        {alloc.voucherNo ? ` · Vch #${alloc.voucherNo}` : ""}
                        {alloc.paymentMode ? ` · ${alloc.paymentMode}` : ""}
                        {alloc.remarks ? ` · ${alloc.remarks}` : ""}
                      </td>
                      {showCompanyColumns && (
                        <>
                          <td className="px-3 py-1 border-r border-slate-200"></td>
                          <td className="px-3 py-1 border-r border-slate-200"></td>
                        </>
                      )}
                      <td className="px-3 py-1 border-r border-slate-200 text-[9px] font-bold text-emerald-500 uppercase text-right">
                        CR
                      </td>
                      {renderEmptyAmountCells(1)}
                      <td className="px-3 py-1 text-right font-black text-emerald-700 border-r border-slate-200 tabular-nums">
                        {formatLedgerAmount(alloc.allocatedAmount)}
                      </td>
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
                    </tr>
                  ))}

                {hasBreakdown && row.raw?.uiType === "entry" && (
                  <tr
                    key={`calc-${row.id}`}
                    className="border-b-2 border-slate-300 text-[10px] bg-slate-100/70 font-bold"
                  >
                    <td className="px-3 py-1 border-r border-slate-200"></td>
                    <td className="px-3 py-1 text-slate-900 border-r border-slate-200 leading-snug max-w-md uppercase tracking-wider">
                      ➤ Net Payable = Gross − CD − Claims − BankChgs −
                      2ndClaim − Others − TDS + GST
                    </td>
                    {showCompanyColumns && (
                      <>
                        <td className="px-3 py-1 border-r border-slate-200"></td>
                        <td className="px-3 py-1 border-r border-slate-200"></td>
                      </>
                    )}
                    <td className="px-3 py-1 text-right font-black text-[#1e3a5f] border-r border-slate-200 tabular-nums bg-white/60">
                      = {formatLedgerAmount(row.debit)}
                    </td>
                    {renderEmptyAmountCells(1)}
                    <td className="px-3 py-1 border-r border-slate-200"></td>
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1"></td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="bg-slate-900 text-white">{footer}</tr>
          </tfoot>
        )}
      </table>
      </div>
    </div>
  );
};

export default TallyLedgerBook;
