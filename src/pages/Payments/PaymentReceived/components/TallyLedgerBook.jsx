import { formatLedgerAmount } from "../utils/paymentLedgerUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const TallyLedgerBook = ({
  rows = [],
  loading = false,
  emptyMessage = "No ledger entries for this company mapping.",
  showCompanyColumns = true,
  footer,
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

      // Header Company Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3,",
        pageWidth / 2,
        23,
        { align: "center" },
      );
      doc.text(
        "Bidhannagar, Kolkata, West Bengal 700106",
        pageWidth / 2,
        28,
        { align: "center" },
      );

      // Title
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 95);
      doc.text("Payment Voucher", pageWidth / 2, 35, {
        align: "center",
      });

      // Divider
      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      let currentY = 48;

      // Purchase Details / From sections
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const col1X = margin;
      const col2X = pageWidth / 2;

      // Left Column - Purchased From / Payment To
      doc.text("Payment To / From:", col1X, currentY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (row.supplierCompany) {
        doc.text(row.supplierCompany, col1X, currentY + 5);
      } else if (row.buyerCompany) {
        doc.text(row.buyerCompany, col1X, currentY + 5);
      }
      currentY += 15;

      if (row.raw?.supplierCompanyAddress) {
        doc.text(row.raw.supplierCompanyAddress, col1X, currentY);
        currentY += 5;
      }

      if (row.raw?.supplierGstin) {
        doc.setFont("helvetica", "bold");
        doc.text("GSTIN:", col1X, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(row.raw.supplierGstin, col1X + 20, currentY);
        currentY += 5;
      }

      // Right Column - Purchase Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Purchase Details:", col2X, 48);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      const purchaseDetailsY = 48;

      // Date
      if (row.date) {
        doc.setFont("helvetica", "bold");
        doc.text("Date:", col2X, purchaseDetailsY + 5);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(row.date).toLocaleDateString("en-GB"), col2X + 35, purchaseDetailsY + 5);
      }

      // Voucher No
      if (row.raw?.voucherNo || row.id) {
        doc.setFont("helvetica", "bold");
        doc.text("Voucher No:", col2X, purchaseDetailsY + 10);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.raw?.voucherNo || row.id || "-"), col2X + 35, purchaseDetailsY + 10);
      }

      // Bill No
      if (row.raw?.billNo || row.raw?.billNumber) {
        doc.setFont("helvetica", "bold");
        doc.text("Bill No:", col2X, purchaseDetailsY + 15);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.raw?.billNo || row.raw?.billNumber || "-"), col2X + 35, purchaseDetailsY + 15);
      }

      // Sauda No
      if (row.raw?.saudaNo) {
        doc.setFont("helvetica", "bold");
        doc.text("Sauda No:", col2X, purchaseDetailsY + 20);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.raw.saudaNo), col2X + 35, purchaseDetailsY + 20);
      }

      currentY = Math.max(currentY, purchaseDetailsY + 28);

      // Add some space
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      // Claims / Deduction Summary
      const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
      if (hasClaims) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Quality Claim Summary:", margin, currentY);
        currentY += 7;

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
          head: [["Parameter", "Standard %", "Actual %", "Claim Amount"]],
          body: claimTableData,
          theme: "grid",
          headStyles: {
            fillColor: [30, 58, 95],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: "right", cellWidth: 25 },
            2: { halign: "right", cellWidth: 25 },
            3: { halign: "right", cellWidth: 30 },
          },
          margin: { left: margin, right: margin },
        });

        currentY = doc.lastAutoTable?.finalY + 8;
      }

      // Amount Summary
      doc.setFontSize(10);
      const summaryX = pageWidth - margin;
      const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));

      // Total Claims
      let totalClaims = 0;
      if (hasClaims) {
        totalClaims = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .reduce((sum, c) => sum + Number(c.claimAmount), 0);

        doc.setFont("helvetica", "bold");
        doc.text("Total Deductions:", summaryX - 70, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(`₹ ${totalClaims.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryX, currentY, { align: "right" });
        currentY += 6;
      }

      // Total Amount
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", summaryX - 70, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(`₹ ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryX, currentY, { align: "right" });
      currentY += 10;

      // Net Amount (if applicable)
      if (hasClaims && totalAmount > 0) {
        const netAmount = totalAmount - totalClaims;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28);
        doc.text("Net Payable:", summaryX - 70, currentY);
        doc.text(`₹ ${netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryX, currentY, { align: "right" });
        currentY += 10;
        doc.setTextColor(0, 0, 0);
      }

      // Note
      if (row.raw?.remarks) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Note:", margin, currentY);
        doc.setFont("helvetica", "normal");
        const splitRemarks = doc.splitTextToSize(row.raw.remarks, pageWidth - 2 * margin);
        doc.text(splitRemarks, margin, currentY + 5);
        currentY += splitRemarks.length * 5 + 8;
      } else {
        currentY += 5;
      }

      // Footer
      const footerY = pageHeight - 25;
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, footerY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal", pageWidth / 2, footerY + 4, { align: "center" });

      // Authorised Signatory
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Authorised Signatory", pageWidth - margin, pageHeight - 18, {
        align: "right",
      });
      doc.line(
        pageWidth - 60,
        pageHeight - 22,
        pageWidth - margin,
        pageHeight - 22,
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
