import { formatLedgerAmount } from "../utils/paymentLedgerUtils";
import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FaEnvelope, FaFilePdf } from "react-icons/fa";
import QRCode from "qrcode";
import PaymentVoucherPDF from "./PaymentVoucherPDF";

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
}) => {
  const [qrCache, setQrCache] = useState({});
  const [qrLoading, setQrLoading] = useState({});
  const [voucherCounter, setVoucherCounter] = useState({});

  const generateQRCode = async (row) => {
    // Extract payment details for QR code
    const getValue = (...candidates) => {
      for (const value of candidates) {
        if (value && String(value).trim() !== "" && String(value).trim() !== "N/A") {
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
      row.billNo
    );
    const saudaNo = getValue(
      firstMapping?.saudaNo,
      loadingEntry?.saudaNo,
      row.raw?.saudaNo,
      row.saudaNo
    );
    const lorryNo = getValue(
      loadingEntry?.lorryNumber,
      row.raw?.lorryNumber,
      row.lorryNo
    );

    const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));
    const qrText = [
      "HANSARIA FOOD PRIVATE LIMITED",
      `Date: ${row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-"}`,
      `Voucher No: ${row.raw?.voucherNo || row.id || "-"}`,
      `Buyer: ${row.buyerCompany || "-"}`,
      `Seller: ${row.supplierCompany || "-"}`,
      `Sauda No: ${saudaNo}`,
      `Lorry No: ${lorryNo}`,
      `Bill No: ${billNo}`,
      `Amount: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    ].join("\n");
    
    const qrDataUrl = await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });
    return qrDataUrl;
  };

  const handleDownloadClick = async (row) => {
    // Generate QR code first if not in cache
    if (!qrCache[row.id] && !qrLoading[row.id]) {
      setQrLoading((prev) => ({ ...prev, [row.id]: true }));
      try {
        const qrUrl = await generateQRCode(row);
        setQrCache((prev) => ({ ...prev, [row.id]: qrUrl }));
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setQrLoading((prev) => ({ ...prev, [row.id]: false }));
      }
    }

    // Assign voucher number if not already assigned
    if (!voucherCounter[row.id]) {
      const nonOpeningRows = rows.filter(r => !r.isOpening);
      const currentIndex = nonOpeningRows.findIndex(r => r.id === row.id);
      
      if (currentIndex >= 0) {
        // Check which numbers are already assigned
        const usedNumbers = new Set();
        Object.values(voucherCounter).forEach(num => usedNumbers.add(num));
        
        // Find the next available number
        let nextNumber = 1;
        while (usedNumbers.has(nextNumber)) {
          nextNumber++;
        }
        
        setVoucherCounter((prev) => ({
          ...prev,
          [row.id]: nextNumber
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Loading ledger...
        </p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="py-20 px-6 text-center">
        <p className="text-sm font-bold text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-300 bg-[#fffef8] shadow-inner">
      <table className="w-full min-w-[1100px] border-collapse text-left">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[88px]">
              Date
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] min-w-[200px]">
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
              Debit
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[100px] text-right">
              Credit
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[110px] text-right">
              Balance
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[150px]">
              Claim Parameter
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-r border-[#2d4a6f] w-[120px] text-right">
              Claim Amount
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-[100px] text-center">
              Download
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-[200px] text-center">
              Recipient Email
            </th>
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-[100px] text-center">
              Send
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
            const validClaims = hasClaims ? row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0) : [];
            
            // Find buyer and seller company details
            const buyerCompany = buyerCompanies.find(c => 
              c.companyName?.toLowerCase() === (row.buyerCompany || "").toLowerCase()
            );
            const sellerCompany = sellerCompanies.find(c => 
              c.companyName?.toLowerCase() === (row.supplierCompany || "").toLowerCase()
            );

            if (hasClaims) {
              return (
                <>
                  <tr
                    key={`main-${row.id || idx}`}
                    className={[
                      "border-b border-slate-200 text-[11px]",
                      row.isOpening ? "bg-amber-50/80 font-bold" : "hover:bg-sky-50/50",
                      idx % 2 === 0 && !row.isOpening ? "bg-white" : "",
                      idx % 2 === 1 && !row.isOpening ? "bg-slate-50/40" : "",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {row.date
                        ? new Date(row.date).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-800 border-r border-slate-200 leading-snug max-w-md">
                      <span className="font-semibold uppercase text-[10px]">
                        {row.particulars}
                      </span>
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
                    <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
                      {row.debit > 0 ? formatLedgerAmount(row.debit) : ""}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-800 border-r border-slate-200 tabular-nums">
                      {row.credit > 0 ? formatLedgerAmount(row.credit) : ""}
                    </td>
                    <td className="px-3 py-2 text-right font-black text-[#1e3a5f] border-r border-slate-200 tabular-nums">
                      {formatLedgerAmount(row.balance)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 border-r border-slate-200"></td>
                    <td className="px-3 py-2 text-right border-r border-slate-200"></td>
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
                                />
                              }
                              fileName={`Payment_Voucher_${
                                row.vchType || "Voucher"
                              }_${
                                row.date ? new Date(row.date).toISOString().split("T")[0] : ""
                              }.pdf`}
                            >
                              {({ loading }) => (
                                <button
                                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
                                >
                                  {loading ? "Loading..." : <FaFilePdf size={14} />}
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
                  </tr>
                  {validClaims.map((claim, claimIdx) => (
                    <tr
                      key={`claim-${row.id || idx}-${claimIdx}`}
                      className={[
                        "border-b border-slate-200 text-[10px]",
                        idx % 2 === 0 && !row.isOpening ? "bg-sky-50/30" : "bg-slate-50/30",
                      ].join(" ")}
                    >
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1 text-slate-700 border-r border-slate-200 leading-snug max-w-md">
                        <span className="font-medium italic">
                          Claim: {claim.parameterName || "Unnamed"}
                        </span>
                      </td>
                      {showCompanyColumns && (
                        <>
                          <td className="px-3 py-1 border-r border-slate-200"></td>
                          <td className="px-3 py-1 border-r border-slate-200"></td>
                        </>
                      )}
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1 border-r border-slate-200"></td>
                      <td className="px-3 py-1 text-slate-700 border-r border-slate-200">
                        {claim.parameterName || "Unnamed"}
                      </td>
                      <td className="px-3 py-1 text-right font-medium text-rose-700 tabular-nums">
                        {formatLedgerAmount(claim.claimAmount)}
                      </td>
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
                    </tr>
                  ))}
                </>
              );
            }

            return (
              <tr
                key={row.id || idx}
                className={[
                  "border-b border-slate-200 text-[11px]",
                  row.isOpening ? "bg-amber-50/80 font-bold" : "hover:bg-sky-50/50",
                  idx % 2 === 0 && !row.isOpening ? "bg-white" : "",
                  idx % 2 === 1 && !row.isOpening ? "bg-slate-50/40" : "",
                ].join(" ")}
              >
                <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                  {row.date
                    ? new Date(row.date).toLocaleDateString("en-GB")
                    : "—"}
                </td>
                <td className="px-3 py-2 text-slate-800 border-r border-slate-200 leading-snug max-w-md">
                  <span className="font-semibold uppercase text-[10px]">
                    {row.particulars}
                  </span>
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
                <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-200 tabular-nums">
                  {row.debit > 0 ? formatLedgerAmount(row.debit) : ""}
                </td>
                <td className="px-3 py-2 text-right font-bold text-emerald-800 border-r border-slate-200 tabular-nums">
                  {row.credit > 0 ? formatLedgerAmount(row.credit) : ""}
                </td>
                <td className="px-3 py-2 text-right font-black text-[#1e3a5f] border-r border-slate-200 tabular-nums">
                  {formatLedgerAmount(row.balance)}
                </td>
                <td className="px-3 py-2 border-r border-slate-200"></td>
                <td className="px-3 py-2 text-right border-r border-slate-200"></td>
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
                          fileName={`Payment_Voucher_${
                            row.vchType || "Voucher"
                          }_${
                            row.date ? new Date(row.date).toISOString().split("T")[0] : ""
                          }.pdf`}
                        >
                          {({ loading }) => (
                            <button
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
                            >
                              {loading ? "Loading..." : <FaFilePdf size={14} />}
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
              </tr>
            );
          })}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="bg-slate-900 text-white">
              {footer}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default TallyLedgerBook;
