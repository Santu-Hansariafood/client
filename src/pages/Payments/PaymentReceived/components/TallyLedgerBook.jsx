import { formatLedgerAmount } from "../utils/paymentLedgerUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const TallyLedgerBook = ({
  rows = [],
  loading = false,
  emptyMessage = "No ledger entries for this company mapping.",
  showCompanyColumns = true,
  footer,
  sellerCompanies = [],
  buyerCompanies = [],
}) => {
  const handleDownloadSinglePDF = async (row) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Find buyer and seller company details
      const buyerCompany = buyerCompanies.find(c => 
        c.companyName?.toLowerCase() === (row.buyerCompany || "").toLowerCase()
      );
      const sellerCompany = sellerCompanies.find(c => 
        c.companyName?.toLowerCase() === (row.supplierCompany || "").toLowerCase()
      );

      // Header Company Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 20, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar", pageWidth / 2, 27, { align: "center" });
      doc.text("Kolkata, West Bengal 700106", pageWidth / 2, 33, { align: "center" });

      // Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Payment Voucher", pageWidth / 2, 45, {
        align: "center",
      });
      doc.setLineWidth(0.5);
      doc.line(margin, 48, pageWidth - margin, 48);

      let currentY = 55;

      // Buyer Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Buyer:", margin, currentY);
      doc.setFont("helvetica", "normal");
      if (row.buyerCompany) {
        doc.text(row.buyerCompany, margin + 20, currentY);
      }
      currentY += 6;

      if (buyerCompany) {
        const buyerLoc = `${buyerCompany.location || ""}${buyerCompany.pinCode ? ", " + buyerCompany.pinCode : ""}`;
        const buyerLocLines = doc.splitTextToSize(buyerLoc, pageWidth - 2*margin - 20);
        doc.setFontSize(9);
        doc.text(buyerLocLines, margin + 20, currentY);
        currentY += buyerLocLines.length * 5;
        if (buyerCompany.gstNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("GSTIN:", margin, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(buyerCompany.gstNumber, margin + 20, currentY);
          currentY += 6;
        }
      }

      // Seller Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Seller:", margin, currentY);
      doc.setFont("helvetica", "normal");
      if (row.supplierCompany) {
        doc.text(row.supplierCompany, margin + 20, currentY);
      }
      currentY += 6;

      if (sellerCompany) {
        const sellerAddr = sellerCompany.address || "";
        const sellerAddrLines = doc.splitTextToSize(sellerAddr, pageWidth - 2*margin - 20);
        doc.setFontSize(9);
        doc.text(sellerAddrLines, margin + 20, currentY);
        currentY += sellerAddrLines.length * 5;
        if (sellerCompany.pinNo) {
          doc.text(`Pin: ${sellerCompany.pinNo}`, margin + 20, currentY);
          currentY += 5;
        }
        if (sellerCompany.gstNo) {
          doc.setFont("helvetica", "bold");
          doc.text("GSTIN:", margin, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(sellerCompany.gstNo, margin + 20, currentY);
          currentY += 6;
        }
      }

      // Voucher Details Table
      const voucherDetails = [
        { label: "Date", value: row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-" },
        { label: "Voucher No", value: String(row.raw?.voucherNo || row.id || "-") },
        { label: "Bill No", value: String(row.raw?.billNo || row.raw?.billNumber || "-") },
        { label: "Sauda No", value: String(row.raw?.saudaNo || "-") },
        { label: "Lorry No", value: String(row.raw?.lorryNumber || "-") }
      ];

      const tableWidth = pageWidth - 2*margin;
      const cellWidth = tableWidth / voucherDetails.length;

      doc.setLineWidth(0.2);
      doc.setDrawColor(0, 0, 0);
      doc.roundedRect(margin, currentY, tableWidth, 14, 1, 1);

      for (let i = 0; i < voucherDetails.length; i++) {
        const x = margin + i * cellWidth;
        doc.line(x + cellWidth, currentY, x + cellWidth, currentY + 14);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 95);
        doc.text(voucherDetails[i].label, x + cellWidth/2, currentY + 5, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(voucherDetails[i].value, x + cellWidth/2, currentY + 11, { align: "center" });
      }

      currentY += 20;

      // Claims Table
      const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
      if (hasClaims) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Quality Claims:", margin, currentY);
        currentY += 6;

        const claimTableData = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .map(c => [
            c.parameterName || "Unnamed",
            `${Number(c.standardValue || 0).toFixed(2)}%`,
            `${Number(c.actualValue || 0).toFixed(2)}%`,
            `₹ ${Number(c.claimAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          ]);

        autoTable(doc, {
          startY: currentY,
          head: [["Parameter", "Standard", "Actual", "Amount"]],
          body: claimTableData,
          theme: "grid",
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: "bold",
            halign: "center",
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 75 },
            1: { halign: "center", cellWidth: 30 },
            2: { halign: "center", cellWidth: 30 },
            3: { halign: "right", cellWidth: 40 },
          },
          margin: { left: margin, right: margin },
        });

        currentY = doc.lastAutoTable?.finalY + 8;
      }

      // Amount Summary
      const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));
      let totalClaims = 0;
      if (hasClaims) {
        totalClaims = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .reduce((sum, c) => sum + Number(c.claimAmount), 0);
      }

      const summaryStartY = currentY;
      const summaryCol1X = pageWidth - 80;

      doc.setLineWidth(0.2);
      doc.rect(summaryCol1X - 5, summaryStartY - 3, 85, hasClaims ? 22 : 10);

      let summaryLine = 0;
      if (hasClaims) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Total Claims:", summaryCol1X, summaryStartY + 3 + summaryLine*5);
        doc.text(`₹ ${totalClaims.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin, summaryStartY + 3 + summaryLine*5, { align: "right" });
        summaryLine++;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", summaryCol1X, summaryStartY + 3 + summaryLine*5);
      doc.text(`₹ ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin, summaryStartY + 3 + summaryLine*5, { align: "right" });
      summaryLine++;

      if (hasClaims && totalAmount > 0) {
        const netAmount = totalAmount - totalClaims;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28);
        doc.text("Net Payable:", summaryCol1X, summaryStartY + 3 + summaryLine*5);
        doc.text(`₹ ${netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin, summaryStartY + 3 + summaryLine*5, { align: "right" });
        doc.setTextColor(0, 0, 0);
      }

      currentY = summaryStartY + (hasClaims ? 24 : 14);

      // Seller Bank Details
      if (sellerCompany?.bankDetails && sellerCompany.bankDetails.length > 0) {
        const bank = sellerCompany.bankDetails[0];
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Bank Details:", margin, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Bank: ${bank.bankName}`, margin + 10, currentY);
        currentY += 5;
        doc.text(`Branch: ${bank.branchName}`, margin + 10, currentY);
        currentY += 5;
        doc.text(`A/C: ${bank.accountNumber}`, margin + 10, currentY);
        currentY += 5;
        doc.text(`IFSC: ${bank.ifscCode}`, margin + 10, currentY);
        currentY += 8;
      }

      // Footer
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 30);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Authorised Signatory", pageWidth - margin - 5, pageHeight - 30, {
        align: "right",
      });
      doc.line(
        pageWidth - margin - 70,
        pageHeight - 35,
        pageWidth - margin - 5,
        pageHeight - 35,
      );

      const fileName = `Payment_Voucher_${
        row.vchType || "Voucher"
      }_${
        row.date ? new Date(row.date).toISOString().split("T")[0] : ""
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Download Single PDF Error:", error);
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
            <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-[80px] text-center">
              Download
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
            const validClaims = hasClaims ? row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0) : [];
            
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
                        <button
                          onClick={() => handleDownloadSinglePDF(row)}
                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition"
                        >
                          PDF
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
                    <button
                      onClick={() => handleDownloadSinglePDF(row)}
                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition"
                    >
                      PDF
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
