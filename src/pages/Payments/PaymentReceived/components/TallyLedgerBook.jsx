import {
  formatLedgerAmount,
  getLedgerRowClaimAmount,
} from "../utils/paymentLedgerUtils";
import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FaEnvelope, FaFilePdf, FaEdit, FaTrash } from "react-icons/fa";
import QRCode from "qrcode";
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
  onEdit,
  onDelete,
}) => {
  const [qrCache, setQrCache] = useState({});
  const [qrLoading, setQrLoading] = useState({});
  const [voucherCounter, setVoucherCounter] = useState({});

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

  const handleDownloadClick = async (row) => {
    let currentVoucherNumber = voucherCounter[row.id];
    if (!currentVoucherNumber) {
      const nonOpeningRows = rows.filter((r) => !r.isOpening);
      const currentIndex = nonOpeningRows.findIndex((r) => r.id === row.id);

      if (currentIndex >= 0) {
        const usedNumbers = new Set();
        Object.values(voucherCounter).forEach((num) => usedNumbers.add(num));

        let nextNumber = 1;
        while (usedNumbers.has(nextNumber)) {
          nextNumber++;
        }
        currentVoucherNumber = nextNumber;
        setVoucherCounter((prev) => ({
          ...prev,
          [row.id]: nextNumber,
        }));
      }
    }

    if (!qrCache[row.id] && !qrLoading[row.id]) {
      setQrLoading((prev) => ({ ...prev, [row.id]: true }));
      try {
        const qrUrl = await generateQRCode(row, currentVoucherNumber);
        setQrCache((prev) => ({ ...prev, [row.id]: qrUrl }));
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setQrLoading((prev) => ({ ...prev, [row.id]: false }));
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!rows.length) {
    return (
      <div className="py-20 px-6 text-center">
        <p className="text-sm font-bold text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  const renderAmountCells = (r, dispClaim) => (
    <>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.grossAmount > 0 ? formatLedgerAmount(r.grossAmount) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.gstAmount > 0 ? formatLedgerAmount(r.gstAmount) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {dispClaim > 0 ? formatLedgerAmount(dispClaim) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.cdAmount > 0 ? formatLedgerAmount(r.cdAmount) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.bankCharges > 0 ? formatLedgerAmount(r.bankCharges) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.secondClaim > 0 ? formatLedgerAmount(r.secondClaim) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.otherCharges > 0 ? formatLedgerAmount(r.otherCharges) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
        {r.tds > 0 ? formatLedgerAmount(r.tds) : ""}
      </td>
      <td className="px-3 py-2 text-right font-bold text-emerald-800 border-r border-slate-200 tabular-nums">
        {r.credit > 0 ? formatLedgerAmount(r.credit) : ""}
      </td>
      <td className="px-3 py-2 text-right font-black text-[#1e3a5f] border-r border-slate-200 tabular-nums">
        {formatLedgerAmount(
          r.raw?.uiType === "entry" ? r.debit : r.balance,
        )}
      </td>
    </>
  );

  const renderActionCells = (row, buyerCompany, sellerCompany) => (
    <>
      <td className="px-3 py-2 text-center">
        {!row.isOpening && (
          <>
            {(!qrCache[row.id] || qrLoading[row.id]) && (
              <button
                onClick={() => handleDownloadClick(row)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
              >
                {qrLoading[row.id] ? "Preparing..." : <FaFilePdf size={14} />}
              </button>
            )}
            {qrCache[row.id] && !qrLoading[row.id] && (
              <PDFDownloadLink
                document={
                  <PaymentVoucherPDF
                    row={row}
                    buyerCompany={buyerCompany}
                    sellerCompany={sellerCompany}
                    qrCodeUrl={qrCache[row.id]}
                    voucherNumber={voucherCounter[row.id]}
                  />
                }
                fileName={`Payment_Voucher_${(
                  row.buyerCompany || "Buyer"
                ).replace(/[^a-zA-Z0-9]/g, "_")}_${(
                  row.supplierCompany || "Seller"
                ).replace(/[^a-zA-Z0-9]/g, "_")}_${
                  row.date
                    ? new Date(row.date).toISOString().split("T")[0]
                    : ""
                }.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow">
                    {pdfLoading ? <Loading /> : <FaFilePdf size={14} />}
                  </button>
                )}
              </PDFDownloadLink>
            )}
          </>
        )}
      </td>
      <td className="px-3 py-2 text-center text-xs text-slate-600">
        {sellerCompany?.email || "-"}
      </td>
      <td className="px-3 py-2 text-center">
        {!row.isOpening && sellerCompany?.email && (
          <button
            onClick={() => onSendEmail({ row, buyerCompany, sellerCompany })}
            disabled={sendingEmailIds.has(row.id)}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded text-xs font-bold transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingEmailIds.has(row.id) ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              <FaEnvelope size={14} />
            )}
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {!row.isOpening && row.raw && onEdit && (
          <button
            onClick={() => onEdit(row.raw)}
            className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded text-xs font-bold transition shadow"
          >
            <FaEdit size={14} />
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {!row.isOpening && row.raw && onDelete && (
          <button
            onClick={() => onDelete(row.raw._id)}
            className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded text-xs font-bold transition shadow"
          >
            <FaTrash size={14} />
          </button>
        )}
      </td>
    </>
  );

  const renderEmptyAmountCells = (count = 10) =>
    Array.from({ length: count }).map((_, i) => (
      <td key={`e-${i}`} className="px-3 py-1 border-r border-slate-200"></td>
    ));

  return (
    <div className="overflow-x-auto border border-slate-300 bg-[#fffef8] shadow-inner">
      <table className="w-full min-w-[1700px] border-collapse text-left">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px]">
              Date
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] min-w-[260px]">
              Particulars
            </th>
            {showCompanyColumns && (
              <>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[120px]">
                  Buyer Co.
                </th>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[120px]">
                  Seller Co.
                </th>
              </>
            )}
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[72px]">
              Vch
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Due Amount
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              GST
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Claims
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              CD
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Bank Charges
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              2nd Claim
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Other Charges
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              TDS
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Credit
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[110px] text-right">
              Due / Bal
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-center">
              Download
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[200px] text-center">
              Recipient Email
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-center">
              Send
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[80px] text-center">
              Edit
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-[80px] text-center">
              Delete
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const displayedClaimAmount = getLedgerRowClaimAmount(row);
            const breakdown = row.breakdown || [];
            const paymentAllocations = row.paymentAllocations || [];
            const hasBreakdown = breakdown.length > 0;
            const hasPaymentAllocations = paymentAllocations.length > 0;

            const buyerCompany = buyerCompanies.find(
              (c) =>
                c.companyName?.toLowerCase() ===
                (row.buyerCompany || "").toLowerCase(),
            );
            const sellerCompany = sellerCompanies.find(
              (c) =>
                c.companyName?.toLowerCase() ===
                (row.supplierCompany || "").toLowerCase(),
            );

            const baseRowClass = [
              "border-b border-slate-200 text-[11px]",
              row.isOpening
                ? "bg-green-50/80 font-bold"
                : "hover:bg-sky-50/50",
              idx % 2 === 0 && !row.isOpening ? "bg-white" : "",
              idx % 2 === 1 && !row.isOpening ? "bg-slate-50/40" : "",
            ].join(" ");

            const subRowBg = idx % 2 === 0 ? "bg-amber-50/20" : "bg-slate-50/30";
            const displayDate = row.unloadingDate || row.date;
            const companySpacer = showCompanyColumns ? 2 : 0;

            return (
              <>
                <tr key={`m-${row.id || idx}`} className={baseRowClass}>
                  <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                    {displayDate
                      ? new Date(displayDate).toLocaleDateString("en-GB")
                      : "—"}
                    {row.unloadingDate &&
                      row.loadingDate &&
                      row.unloadingDate !== row.loadingDate && (
                        <div className="text-[9px] font-normal text-slate-500">
                          Load:{" "}
                          {new Date(row.loadingDate).toLocaleDateString(
                            "en-GB",
                          )}
                        </div>
                      )}
                  </td>
                  <td className="px-3 py-2 text-slate-800 border-r border-slate-200 leading-snug max-w-md">
                    <div className="font-semibold uppercase text-[10px]">
                      {row.particulars}
                    </div>
                    {row.isPaymentRow && row.voucherNo && (
                      <div className="text-[9px] font-bold text-indigo-600 mt-0.5">
                        Vch #{row.voucherNo} · {row.paymentMode || ""}
                      </div>
                    )}
                    {row.raw?.uiType === "entry" && row.weight > 0 && (
                      <div className="text-[9px] font-bold text-emerald-700 mt-0.5">
                        {row.isUnloading ? "Unloaded:" : "Loaded:"}{" "}
                        {Number(row.weight).toFixed(3)}T @ ₹
                        {Number(row.rate).toFixed(2)}
                        {row.billNumber ? ` · Bill ${row.billNumber}` : ""}
                      </div>
                    )}
                    {(row.generalRemarks || row.remarks) && (
                      <div className="text-[9px] italic text-slate-500 mt-0.5">
                        Note: {row.generalRemarks || row.remarks}
                      </div>
                    )}
                  </td>
                  {showCompanyColumns && (
                    <>
                      <td className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase border-r border-slate-200 truncate max-w-[120px]">
                        {row.buyerCompany || "—"}
                      </td>
                      <td className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase border-r border-slate-200 truncate max-w-[120px]">
                        {row.supplierCompany || "—"}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase border-r border-slate-200">
                    {row.vchType}
                  </td>
                  {renderAmountCells(row, displayedClaimAmount)}
                  {renderActionCells(row, buyerCompany, sellerCompany)}
                </tr>

                {hasBreakdown &&
                  breakdown.map((item, bIdx) => {
                    const catCols = {
                      gross: { col: 0, cls: "text-slate-800", sign: "" },
                      gst: { col: 1, cls: "text-pink-700", sign: "+" },
                      qualityClaim: { col: 2, cls: "text-red-700", sign: "−" },
                      cd: { col: 3, cls: "text-yellow-700", sign: "−" },
                      bankCharges: { col: 4, cls: "text-orange-700", sign: "−" },
                      secondClaim: { col: 5, cls: "text-purple-700", sign: "−" },
                      otherCharges: { col: 6, cls: "text-teal-700", sign: "−" },
                      tds: { col: 7, cls: "text-red-800", sign: "−" },
                    };
                    const conf = catCols[item.category];
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
                        {conf ? (
                          <>
                            {renderEmptyAmountCells(conf.col)}
                            <td
                              className={[
                                "px-3 py-1 text-right font-bold tabular-nums border-r border-slate-200",
                                conf.cls,
                              ].join(" ")}
                            >
                              {conf.sign} {formatLedgerAmount(item.amount)}
                            </td>
                            {renderEmptyAmountCells(9 - conf.col)}
                          </>
                        ) : (
                          <>
                            <td
                              className={[
                                "px-3 py-1 text-right font-bold tabular-nums border-r border-slate-200",
                                item.type === "add"
                                  ? "text-emerald-700"
                                  : "text-rose-700",
                              ].join(" ")}
                              colSpan={10}
                            >
                              {item.type === "add" ? "+" : "−"}{" "}
                              {formatLedgerAmount(item.amount)}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-1"></td>
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
                      {renderEmptyAmountCells(7)}
                      <td className="px-3 py-1 text-right font-black text-emerald-700 border-r border-slate-200 tabular-nums">
                        {formatLedgerAmount(alloc.allocatedAmount)}
                      </td>
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
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
                    <td className="px-3 py-1 border-r border-slate-200"></td>
                    {renderEmptyAmountCells(8)}
                    <td className="px-3 py-1 text-right font-black text-[#1e3a5f] border-r border-slate-200 tabular-nums bg-white/60">
                      = {formatLedgerAmount(row.debit)}
                    </td>
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1"></td>
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
  );
};

export default TallyLedgerBook;
