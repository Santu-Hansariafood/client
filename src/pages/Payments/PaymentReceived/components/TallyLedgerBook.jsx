import { formatLedgerAmount } from "../utils/paymentLedgerUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const numberToWords = (num) => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const makeWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) {
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + makeWords(n % 100) : "");
    }
    if (n < 100000) {
      return makeWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + makeWords(n % 1000) : "");
    }
    if (n < 10000000) {
      return makeWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + makeWords(n % 100000) : "");
    }
    return makeWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + makeWords(n % 10000000) : "");
  };
  
  const integer = Math.floor(num);
  const fraction = Math.round((num - integer) * 100);
  let words = makeWords(integer) + " Rupees";
  if (fraction > 0) words += " and " + makeWords(fraction) + " Paise";
  return words + " Only";
};

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
      console.log("Starting PDF generation for row:", row);
      console.log("Row raw data:", row.raw);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const pageHeight = doc.internal.pageSize.getHeight();
      console.log("PDF initialized");

      // Find buyer and seller company details
      const buyerCompany = buyerCompanies.find(c => 
        c.companyName?.toLowerCase() === (row.buyerCompany || "").toLowerCase()
      );
      const sellerCompany = sellerCompanies.find(c => 
        c.companyName?.toLowerCase() === (row.supplierCompany || "").toLowerCase()
      );
      console.log("Companies found:", { buyerCompany, sellerCompany });

      let currentY = 20;

      // Header Block - Company Name
      doc.setLineWidth(0.7);
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, 12, pageWidth - 2*margin, 30);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 26, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text("Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3", pageWidth / 2, 33, { align: "center" });
      doc.text("Bidhannagar, Kolkata, West Bengal 700106", pageWidth / 2, 39, { align: "center" });

      currentY = 48;

      // Title Block
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, currentY, pageWidth - 2*margin, 12, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("PAYMENT VOUCHER", pageWidth / 2, currentY + 8, { align: "center" });
      currentY += 18;

      // Buyer and Seller Details Blocks
      const colWidth = (pageWidth - 2*margin - 8)/2;
      const leftCol = margin;
      const rightCol = margin + colWidth + 8;

      // Buyer Block
      doc.rect(leftCol, currentY, colWidth, 40);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("TO (BUYER)", leftCol + 5, currentY + 7);
      
      let buyerY = currentY + 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (row.buyerCompany) {
        doc.setFont("helvetica", "bold");
        doc.text(row.buyerCompany, leftCol + 5, buyerY);
        buyerY += 5;
        doc.setFont("helvetica", "normal");
      }

      if (buyerCompany) {
        const buyerLoc = `${buyerCompany.location || ""}${buyerCompany.pinCode ? ` - ${buyerCompany.pinCode}` : ""}`;
        const buyerLocLines = doc.splitTextToSize(buyerLoc, colWidth - 10);
        doc.text(buyerLocLines, leftCol + 5, buyerY);
        buyerY += buyerLocLines.length * 5;
        if (buyerCompany.gstNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("GSTIN:", leftCol + 5, buyerY);
          doc.setFont("helvetica", "normal");
          doc.text(buyerCompany.gstNumber, leftCol + 28, buyerY);
          buyerY += 5;
        }
      }

      // Seller Block
      doc.rect(rightCol, currentY, colWidth, 40);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("FROM (SELLER)", rightCol + 5, currentY + 7);
      
      let sellerY = currentY + 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (row.supplierCompany) {
        doc.setFont("helvetica", "bold");
        doc.text(row.supplierCompany, rightCol + 5, sellerY);
        sellerY += 5;
        doc.setFont("helvetica", "normal");
      }

      if (sellerCompany) {
        const sellerAddr = sellerCompany.address || "";
        const sellerAddrLines = doc.splitTextToSize(sellerAddr, colWidth - 10);
        doc.text(sellerAddrLines, rightCol + 5, sellerY);
        sellerY += sellerAddrLines.length * 5;
        if (sellerCompany.pinNo) {
          doc.setFont("helvetica", "bold");
          doc.text("Pin:", rightCol + 5, sellerY);
          doc.setFont("helvetica", "normal");
          doc.text(sellerCompany.pinNo, rightCol + 20, sellerY);
          sellerY += 5;
        }
        if (sellerCompany.gstNo) {
          doc.setFont("helvetica", "bold");
          doc.text("GSTIN:", rightCol + 5, sellerY);
          doc.setFont("helvetica", "normal");
          doc.text(sellerCompany.gstNo, rightCol + 28, sellerY);
          sellerY += 5;
        }
      }

      currentY += 48;
      console.log("Company sections done, currentY:", currentY);

      // Voucher Details Block
      doc.rect(margin, currentY, pageWidth - 2*margin, 22);
      
      const voucherDetails = [
        { label: "Date", value: row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-" },
        { label: "Voucher No", value: String(row.raw?.voucherNo || row.id || "-") },
        { label: "Bill No", value: String(row.raw?.billNo || row.raw?.billNumber || "-") },
        { label: "Sauda No", value: String(row.raw?.saudaNo || row.saudaNo || "-") },
        { label: "Lorry No", value: String(row.raw?.lorryNumber || row.lorryNo || "-") },
      ];
      
      console.log("Voucher details:", voucherDetails);

      const tableWidth = pageWidth - 2*margin;
      const cellWidth = tableWidth / voucherDetails.length;

      for (let i = 0; i < voucherDetails.length; i++) {
        const x = margin + i * cellWidth;
        if (i < voucherDetails.length - 1) {
          doc.line(x + cellWidth, currentY, x + cellWidth, currentY + 22);
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(voucherDetails[i].label, x + cellWidth/2, currentY + 8, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(voucherDetails[i].value, x + cellWidth/2, currentY + 15, { align: "center" });
      }

      currentY += 30;
      console.log("Voucher table done, currentY:", currentY);

      // Claims Table Block
      const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
      if (hasClaims) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("QUALITY CLAIMS", margin, currentY);
        currentY += 6;

        const claimTableData = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .map(c => [
            c.parameterName || "Unnamed",
            `${Number(c.standardValue || 0).toFixed(2)}%`,
            `${Number(c.actualValue || 0).toFixed(2)}%`,
            `₹ ${Number(c.claimAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          ]);

        console.log("Adding claim table with data:", claimTableData);
        
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
            cellPadding: 4,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 85 },
            1: { halign: "center", cellWidth: 40 },
            2: { halign: "center", cellWidth: 40 },
            3: { halign: "right", cellWidth: 45 },
          },
          margin: { left: margin, right: margin },
        });

        currentY = doc.lastAutoTable?.finalY + 10;
        console.log("Claim table done, currentY:", currentY);
      }

      // Calculate amounts
      const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));
      let totalClaims = 0;
      if (hasClaims) {
        totalClaims = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .reduce((sum, c) => sum + Number(c.claimAmount), 0);
      }

      // Amount Summary Block
      const summaryHeight = hasClaims ? 42 : 24;
      doc.rect(margin, currentY, pageWidth - 2*margin, summaryHeight);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("AMOUNT SUMMARY", margin + 5, currentY + 8);

      let summaryLineY = currentY + 16;
      if (hasClaims) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Total Claims:", margin + 5, summaryLineY);
        doc.text(`₹ ${totalClaims.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, summaryLineY, { align: "right" });
        summaryLineY += 8;
        doc.setLineWidth(0.3);
        doc.line(margin + 5, summaryLineY - 2, pageWidth - margin - 5, summaryLineY - 2);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Total Amount:", margin + 5, summaryLineY);
      doc.text(`₹ ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, summaryLineY, { align: "right" });
      summaryLineY += 8;

      if (hasClaims && totalAmount > 0) {
        const netAmount = totalAmount - totalClaims;
        doc.line(margin + 5, summaryLineY - 2, pageWidth - margin - 5, summaryLineY - 2);
        doc.setFontSize(12);
        doc.text("Net Payable:", margin + 5, summaryLineY + 3);
        doc.text(`₹ ${netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, summaryLineY + 3, { align: "right" });
      }

      currentY += summaryHeight + 10;
      console.log("Summary done, currentY:", currentY);

      // Amount in Words Block
      doc.rect(margin, currentY, pageWidth - 2*margin, 22);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text("AMOUNT IN WORDS", margin + 5, currentY + 8);
      
      const finalAmountForWords = hasClaims && totalAmount > 0 ? totalAmount - totalClaims : totalAmount;
      const amountWords = numberToWords(finalAmountForWords);
      console.log("Amount in words:", amountWords);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const wordsLines = doc.splitTextToSize(amountWords, pageWidth - 2*margin - 50);
      doc.text(wordsLines, margin + 55, currentY + 8);

      currentY += 30;
      console.log("Amount in words done, currentY:", currentY);

      // Seller Bank Details Block
      if (sellerCompany?.bankDetails && sellerCompany.bankDetails.length > 0) {
        const bank = sellerCompany.bankDetails[0];
        
        doc.rect(margin, currentY, pageWidth - 2*margin - 55, 32);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("SELLER BANK DETAILS", margin + 5, currentY + 8);

        let bankY = currentY + 15;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        doc.setFont("helvetica", "bold");
        doc.text("Bank:", margin + 5, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.bankName, margin + 28, bankY);

        doc.setFont("helvetica", "bold");
        doc.text("Branch:", margin + 80, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.branchName, margin + 100, bankY);

        bankY += 7;

        doc.setFont("helvetica", "bold");
        doc.text("A/c:", margin + 5, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.accountNumber, margin + 22, bankY);

        doc.setFont("helvetica", "bold");
        doc.text("IFSC:", margin + 80, bankY);
        doc.setFont("helvetica", "normal");
        doc.text(bank.ifscCode, margin + 98, bankY);

        // QR Code
        const qrSectionWidth = 40;
        const qrStartX = pageWidth - margin - qrSectionWidth;
        const qrText = `Payment Voucher: ${row.raw?.voucherNo || row.id}\nAmount: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
        console.log("Generating QR code for:", qrText);
        const qrDataUrl = await QRCode.toDataURL(qrText, {
          margin: 1,
          width: 200,
          color: {
            dark: "#000000",
            light: "#ffffff"
          }
        });
        console.log("QR code generated");
        
        doc.addImage(qrDataUrl, "PNG", qrStartX, currentY, qrSectionWidth, qrSectionWidth);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text("SCAN", qrStartX + qrSectionWidth/2, currentY + qrSectionWidth + 4, { align: "center" });

        currentY += 40;
        console.log("Bank details done, currentY:", currentY);
      }

      // Footer Block
      doc.setLineWidth(0.7);
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, pageHeight - 65, pageWidth - 2*margin, 50);
      
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 45, pageWidth - margin, pageHeight - 45);

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("This is a system generated payment voucher.", margin + 5, pageHeight - 56);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin + 5, pageHeight - 50);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("For Hansaria Food Pvt. Ltd.", pageWidth - margin - 5, pageHeight - 32, { align: "right" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Authorised Signatory", pageWidth - margin - 5, pageHeight - 18, { align: "right" });
      
      doc.setLineWidth(0.5);
      doc.line(pageWidth - margin - 85, pageHeight - 24, pageWidth - margin - 5, pageHeight - 24);

      const fileName = `Payment_Voucher_${
        row.vchType || "Voucher"
      }_${
        row.date ? new Date(row.date).toISOString().split("T")[0] : ""
      }.pdf`;
      
      console.log("Saving PDF as:", fileName);
      doc.save(fileName);
      console.log("PDF saved successfully!");
      
    } catch (error) {
      console.error("ERROR in PDF generation:", error);
      alert("Error generating PDF. Check console for details.");
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
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
                        >
                          Download PDF
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
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
                    >
                      Download PDF
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
