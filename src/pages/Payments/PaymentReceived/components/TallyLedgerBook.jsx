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

      // Header Company Info with Border
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(margin, 10, pageWidth - 2*margin, 35, 2, 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 95);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 22, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar,",
        pageWidth / 2,
        28,
        { align: "center" },
      );
      doc.text(
        "Kolkata, West Bengal 700106, India",
        pageWidth / 2,
        33,
        { align: "center" },
      );

      // Title
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 95);
      doc.text("Payment Voucher", pageWidth / 2, 50, {
        align: "center",
      });
      doc.setLineWidth(0.3);
      doc.line(margin, 53, pageWidth - margin, 53);

      let currentY = 58;

      // Buyer and Seller Details Side by Side
      const colWidth = (pageWidth - 2*margin - 5)/2;
      const leftCol = margin;
      const rightCol = margin + colWidth + 5;

      // Buyer Company Section
      doc.setFillColor(240, 245, 250);
      doc.roundedRect(leftCol, currentY - 3, colWidth, 35, 2, 2, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 95);
      doc.text("Buyer Company Details", leftCol + 3, currentY + 3);

      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      let buyerY = currentY + 10;
      
      if (row.buyerCompany) {
        doc.setFont("helvetica", "bold");
        doc.text("Name:", leftCol + 3, buyerY);
        doc.setFont("helvetica", "normal");
        doc.text(row.buyerCompany, leftCol + 25, buyerY);
        buyerY += 5;
      }

      if (buyerCompany?.location) {
        doc.setFont("helvetica", "bold");
        doc.text("Location:", leftCol + 3, buyerY);
        doc.setFont("helvetica", "normal");
        doc.text(buyerCompany.location, leftCol + 25, buyerY);
        buyerY += 5;
      }

      if (buyerCompany?.gstNumber) {
        doc.setFont("helvetica", "bold");
        doc.text("GSTIN:", leftCol + 3, buyerY);
        doc.setFont("helvetica", "normal");
        doc.text(buyerCompany.gstNumber, leftCol + 25, buyerY);
        buyerY += 5;
      }

      // Seller Company Section
      doc.setFillColor(245, 250, 245);
      doc.roundedRect(rightCol, currentY - 3, colWidth, 48, 2, 2, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(35, 100, 35);
      doc.text("Seller Company Details", rightCol + 3, currentY + 3);

      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      let sellerY = currentY + 10;
      
      if (row.supplierCompany) {
        doc.setFont("helvetica", "bold");
        doc.text("Name:", rightCol + 3, sellerY);
        doc.setFont("helvetica", "normal");
        doc.text(row.supplierCompany, rightCol + 25, sellerY);
        sellerY += 5;
      }

      if (sellerCompany?.address) {
        doc.setFont("helvetica", "bold");
        doc.text("Address:", rightCol + 3, sellerY);
        doc.setFont("helvetica", "normal");
        const addrLines = doc.splitTextToSize(sellerCompany.address, colWidth - 30);
        doc.text(addrLines, rightCol + 25, sellerY);
        sellerY += addrLines.length * 5;
      }

      if (sellerCompany?.gstNo) {
        doc.setFont("helvetica", "bold");
        doc.text("GSTIN:", rightCol + 3, sellerY);
        doc.setFont("helvetica", "normal");
        doc.text(sellerCompany.gstNo, rightCol + 25, sellerY);
        sellerY += 5;
      }

      currentY = Math.max(buyerY, sellerY) + 5;

      // Voucher Details
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, currentY, pageWidth - 2*margin, 35, 2, 2, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(margin, currentY, pageWidth - 2*margin, 35, 2, 2);

      let vchY = currentY + 6;
      const vchColWidth = (pageWidth - 2*margin)/3;

      // Date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Date:", margin + 5, vchY);
      doc.setFont("helvetica", "normal");
      if (row.date) {
        doc.text(new Date(row.date).toLocaleDateString("en-GB"), margin + 25, vchY);
      }

      // Voucher No
      doc.setFont("helvetica", "bold");
      doc.text("Voucher No:", margin + vchColWidth + 5, vchY);
      doc.setFont("helvetica", "normal");
      doc.text(String(row.raw?.voucherNo || row.id || "-"), margin + vchColWidth + 35, vchY);

      // Bill No
      doc.setFont("helvetica", "bold");
      doc.text("Bill No:", margin + 2*vchColWidth + 5, vchY);
      doc.setFont("helvetica", "normal");
      doc.text(String(row.raw?.billNo || row.raw?.billNumber || "-"), margin + 2*vchColWidth + 30, vchY);

      vchY += 7;

      // Sauda No
      doc.setFont("helvetica", "bold");
      doc.text("Sauda No:", margin + 5, vchY);
      doc.setFont("helvetica", "normal");
      doc.text(String(row.raw?.saudaNo || "-"), margin + 28, vchY);

      // Lorry No
      doc.setFont("helvetica", "bold");
      doc.text("Lorry No:", margin + vchColWidth + 5, vchY);
      doc.setFont("helvetica", "normal");
      doc.text(String(row.raw?.lorryNumber || "-"), margin + vchColWidth + 30, vchY);

      currentY += 40;

      // Claims / Deduction Summary
      const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
      if (hasClaims) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 58, 95);
        doc.text("Quality Claim Details", margin, currentY);
        currentY += 5;

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
            cellPadding: 2.5,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { halign: "center", cellWidth: 30 },
            2: { halign: "center", cellWidth: 30 },
            3: { halign: "right", cellWidth: 35 },
          },
          margin: { left: margin, right: margin },
        });

        currentY = doc.lastAutoTable?.finalY + 8;
      }

      // Amount Summary
      const summaryWidth = 90;
      const summaryStartX = pageWidth - margin - summaryWidth;
      doc.setFillColor(245, 250, 245);
      doc.roundedRect(summaryStartX - 2, currentY - 3, summaryWidth + 4, hasClaims ? 30 : 18, 2, 2, 'F');
      doc.roundedRect(summaryStartX - 2, currentY - 3, summaryWidth + 4, hasClaims ? 30 : 18, 2, 2);
      
      const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));
      let totalClaims = 0;
      let summaryY = currentY;
      if (hasClaims) {
        totalClaims = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .reduce((sum, c) => sum + Number(c.claimAmount), 0);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Total Deductions:", summaryStartX, summaryY + 5);
        doc.setFont("helvetica", "normal");
        doc.text(`₹ ${totalClaims.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, summaryY + 5, { align: "right" });
        summaryY += 7;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", summaryStartX, summaryY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(`₹ ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, summaryY + 5, { align: "right" });
      summaryY += 8;

      if (hasClaims && totalAmount > 0) {
        const netAmount = totalAmount - totalClaims;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28);
        doc.text("Net Payable:", summaryStartX, summaryY + 5);
        doc.text(`₹ ${netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, summaryY + 5, { align: "right" });
        summaryY += 8;
      }
      
      currentY = summaryY + 3;

      // Seller Bank Details
      if (sellerCompany?.bankDetails && sellerCompany.bankDetails.length > 0) {
        const bank = sellerCompany.bankDetails[0];
        const bankWidth = (pageWidth - 2*margin - 5)/2;
        
        doc.setFillColor(250, 245, 240);
        doc.roundedRect(margin, currentY, bankWidth, 40, 2, 2, 'F');
        doc.roundedRect(margin, currentY, bankWidth, 40, 2, 2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 50, 0);
        doc.text("Seller Bank Details", margin + 5, currentY + 7);
        let bankY = currentY + 14;
        
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        
        doc.setFont("helvetica", "bold");
        doc.text("Bank:", margin + 5, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.bankName, margin + 28, bankY);
        bankY += 5;
        
        doc.setFont("helvetica", "bold");
        doc.text("Branch:", margin + 5, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.branchName, margin + 28, bankY);
        bankY += 5;
        
        doc.setFont("helvetica", "bold");
        doc.text("A/C No:", margin + 5, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.accountNumber, margin + 28, bankY);
        bankY += 5;
        
        doc.setFont("helvetica", "bold");
        doc.text("IFSC:", margin + 5, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.ifscCode, margin + 28, bankY);

        // Add QR Code
        const qrText = `Payment Voucher: ${row.raw?.voucherNo || row.id}\nAmount: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\nSeller: ${row.supplierCompany || "N/A"}\nDate: ${row.date ? new Date(row.date).toLocaleDateString("en-GB") : ""}`;
        const qrDataUrl = await QRCode.toDataURL(qrText, {
          margin: 1,
          width: 120,
          color: {
            dark: "#1e3a5f",
            light: "#ffffff"
          }
        });
        
        doc.addImage(qrDataUrl, 'PNG', margin + bankWidth + 10, currentY, 35, 35);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(30, 58, 95);
        doc.text("Scan to Verify", margin + bankWidth + 10, currentY + 40, { align: "center" });
      }

      // Footer
      const footerY = pageHeight - 35;
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 95);
      doc.text("Authorised Signatory", pageWidth - margin - 3, pageHeight - 15, {
        align: "right",
      });
      doc.line(
        pageWidth - margin - 60,
        pageHeight - 20,
        pageWidth - margin - 3,
        pageHeight - 20,
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
