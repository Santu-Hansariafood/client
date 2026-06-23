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
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
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

      // Header Company Info with gradient effect using rectangles
      doc.setLineWidth(2);
      doc.setDrawColor(30, 58, 95);
      doc.roundedRect(margin, 8, pageWidth - 2*margin, 38, 3, 3);
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.roundedRect(margin + 2, 10, pageWidth - 2*margin - 4, 34, 2, 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 95);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 25, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3", pageWidth / 2, 34, { align: "center" });
      doc.text("Bidhannagar, Kolkata, West Bengal 700106", pageWidth / 2, 40, { align: "center" });

      // Title with decorative line
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Payment Voucher", pageWidth / 2, 58, {
        align: "center",
      });
      doc.setLineWidth(1);
      doc.setDrawColor(30, 58, 95);
      doc.line(margin + 40, 61, pageWidth - margin - 40, 61);
      doc.setLineWidth(0.5);

      let currentY = 68;

      // Buyer and Seller Details Side by Side with better styling
      const colWidth = (pageWidth - 2*margin - 8)/2;
      const leftCol = margin;
      const rightCol = margin + colWidth + 8;

      // Buyer Company Box
      doc.setFillColor(230, 240, 250);
      doc.roundedRect(leftCol, currentY - 3, colWidth, 42, 3, 3, "F");
      doc.setLineWidth(0.8);
      doc.setDrawColor(30, 58, 95);
      doc.roundedRect(leftCol, currentY - 3, colWidth, 42, 3, 3);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 95);
      doc.text("To (Buyer)", leftCol + 8, currentY + 5);

      let buyerY = currentY + 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      if (row.buyerCompany) {
        doc.setFont("helvetica", "bold");
        doc.text(row.buyerCompany, leftCol + 8, buyerY);
        buyerY += 6;
        doc.setFont("helvetica", "normal");
      }

      if (buyerCompany) {
        const buyerLoc = `${buyerCompany.location || ""}${buyerCompany.pinCode ? ` - ${buyerCompany.pinCode}` : ""}`;
        const buyerLocLines = doc.splitTextToSize(buyerLoc, colWidth - 16);
        doc.text(buyerLocLines, leftCol + 8, buyerY);
        buyerY += buyerLocLines.length * 5;
        if (buyerCompany.gstNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("GSTIN: ", leftCol + 8, buyerY);
          doc.setFont("helvetica", "normal");
          doc.text(buyerCompany.gstNumber, leftCol + 30, buyerY);
          buyerY += 5;
        }
      }

      // Seller Company Box
      doc.setFillColor(230, 250, 230);
      doc.roundedRect(rightCol, currentY - 3, colWidth, 42, 3, 3, "F");
      doc.roundedRect(rightCol, currentY - 3, colWidth, 42, 3, 3);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(35, 100, 35);
      doc.text("From (Seller)", rightCol + 8, currentY + 5);

      let sellerY = currentY + 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      if (row.supplierCompany) {
        doc.setFont("helvetica", "bold");
        doc.text(row.supplierCompany, rightCol + 8, sellerY);
        sellerY += 6;
        doc.setFont("helvetica", "normal");
      }

      if (sellerCompany) {
        const sellerAddr = sellerCompany.address || "";
        const sellerAddrLines = doc.splitTextToSize(sellerAddr, colWidth - 16);
        doc.text(sellerAddrLines, rightCol + 8, sellerY);
        sellerY += sellerAddrLines.length * 5;
        if (sellerCompany.pinNo) {
          doc.setFont("helvetica", "bold");
          doc.text("Pin: ", rightCol + 8, sellerY);
          doc.setFont("helvetica", "normal");
          doc.text(sellerCompany.pinNo, rightCol + 22, sellerY);
          sellerY += 5;
        }
        if (sellerCompany.gstNo) {
          doc.setFont("helvetica", "bold");
          doc.text("GSTIN: ", rightCol + 8, sellerY);
          doc.setFont("helvetica", "normal");
          doc.text(sellerCompany.gstNo, rightCol + 30, sellerY);
          sellerY += 5;
        }
      }

      currentY = Math.max(buyerY, sellerY) + 7;

      // Voucher/Purchase Details Table with better styling
      const voucherDetails = [
        { label: "Date", value: row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-" },
        { label: "Voucher No", value: String(row.raw?.voucherNo || row.id || "-") },
        { label: "Bill No", value: String(row.raw?.billNo || row.raw?.billNumber || "-") },
        { label: "Sauda No", value: String(row.raw?.saudaNo || "-") },
        { label: "Lorry No", value: String(row.raw?.lorryNumber || "-") },
      ];

      const tableWidth = pageWidth - 2*margin;
      const cellWidth = tableWidth / voucherDetails.length;

      doc.setLineWidth(0.8);
      doc.setDrawColor(30, 58, 95);
      doc.roundedRect(margin, currentY, tableWidth, 18, 2, 2);
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);

      for (let i = 0; i < voucherDetails.length; i++) {
        const x = margin + i * cellWidth;
        if (i < voucherDetails.length - 1) {
          doc.line(x + cellWidth, currentY, x + cellWidth, currentY + 18);
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 95);
        doc.text(voucherDetails[i].label, x + cellWidth/2, currentY + 7, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(voucherDetails[i].value, x + cellWidth/2, currentY + 13.5, { align: "center" });
      }

      currentY += 24;

      // Claims Table
      const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
      if (hasClaims) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Quality Claims", margin, currentY);
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
            fillColor: [30, 58, 95],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold",
            halign: "center",
          },
          styles: {
            fontSize: 9,
            cellPadding: 5,
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
      }

      // Amount Summary & QR Code with better styling
      const qrSectionWidth = 65;
      const summaryWidth = pageWidth - margin - qrSectionWidth - 8;
      const summaryStartX = margin;
      const qrStartX = pageWidth - margin - qrSectionWidth;

      // QR Code with border
      doc.setLineWidth(0.8);
      doc.setDrawColor(30, 58, 95);
      doc.roundedRect(qrStartX - 2, currentY - 4, qrSectionWidth + 4, qrSectionWidth + 18, 3, 3);
      
      const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));
      let totalClaims = 0;
      if (hasClaims) {
        totalClaims = row.raw.qualityClaims
          .filter(c => Number(c.claimAmount) > 0)
          .reduce((sum, c) => sum + Number(c.claimAmount), 0);
      }

      const qrText = `Payment Voucher: ${row.raw?.voucherNo || row.id}\nAmount: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, {
        margin: 1,
        width: 200,
        color: {
          dark: "#1e3a5f",
          light: "#ffffff"
        }
      });
      
      doc.addImage(qrDataUrl, "PNG", qrStartX, currentY - 2, qrSectionWidth, qrSectionWidth);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 95);
      doc.text("SCAN & VERIFY", qrStartX + qrSectionWidth/2, currentY + qrSectionWidth + 7, { align: "center" });

      // Summary Box with cool styling
      doc.setFillColor(245, 245, 245);
      doc.setLineWidth(0.8);
      doc.roundedRect(summaryStartX, currentY - 4, summaryWidth - 5, hasClaims ? 40 : 28, 3, 3, "F");
      doc.setDrawColor(30, 58, 95);
      doc.roundedRect(summaryStartX, currentY - 4, summaryWidth - 5, hasClaims ? 40 : 28, 3, 3);
      doc.setDrawColor(0, 0, 0);

      let summaryLine = 0;
      if (hasClaims) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Total Claims:", summaryStartX + 10, currentY + 4 + summaryLine*6.5);
        doc.text(`₹ ${totalClaims.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryStartX + summaryWidth - 15, currentY + 4 + summaryLine*6.5, { align: "right" });
        summaryLine++;
        doc.setLineWidth(0.3);
        doc.line(summaryStartX + 8, currentY + 8.5, summaryStartX + summaryWidth - 12, currentY + 8.5);
      }

      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", summaryStartX + 10, currentY + 4 + summaryLine*6.5);
      doc.text(`₹ ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryStartX + summaryWidth - 15, currentY + 4 + summaryLine*6.5, { align: "right" });
      summaryLine++;

      if (hasClaims && totalAmount > 0) {
        const netAmount = totalAmount - totalClaims;
        doc.setLineWidth(0.3);
        doc.line(summaryStartX + 8, currentY + 15, summaryStartX + summaryWidth - 12, currentY + 15);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28);
        doc.text("Net Payable:", summaryStartX + 10, currentY + 4 + summaryLine*6.5);
        doc.text(`₹ ${netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryStartX + summaryWidth - 15, currentY + 4 + summaryLine*6.5, { align: "right" });
        doc.setTextColor(0, 0, 0);
      }

      currentY = currentY + (hasClaims ? 44 : 32);

      // Amount in Words
      doc.setFillColor(250, 250, 240);
      doc.setLineWidth(0.8);
      doc.setDrawColor(30, 58, 95);
      doc.roundedRect(margin, currentY - 4, pageWidth - 2*margin, 22, 2, 2, "F");
      doc.roundedRect(margin, currentY - 4, pageWidth - 2*margin, 22, 2, 2);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 95);
      doc.text("Amount in Words:", margin + 10, currentY + 2);
      
      const finalAmountForWords = hasClaims && totalAmount > 0 ? totalAmount - totalClaims : totalAmount;
      const amountWords = numberToWords(finalAmountForWords);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const wordsLines = doc.splitTextToSize(amountWords, pageWidth - 2*margin - 70);
      doc.text(wordsLines, margin + 65, currentY + 2);

      currentY += 26;

      // Seller Bank Details with improved styling
      if (sellerCompany?.bankDetails && sellerCompany.bankDetails.length > 0) {
        const bank = sellerCompany.bankDetails[0];
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("Seller Bank Details", margin, currentY);
        currentY += 6;

        doc.setFillColor(240, 235, 230);
        doc.setLineWidth(0.8);
        doc.setDrawColor(100, 50, 0);
        doc.roundedRect(margin, currentY - 3, pageWidth - 2*margin, 34, 2, 2, "F");
        doc.roundedRect(margin, currentY - 3, pageWidth - 2*margin, 34, 2, 2);

        let bankY = currentY + 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        const bankColWidth = (pageWidth - 2*margin - 24)/3;
        let bankColX = margin + 10;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 50, 0);
        doc.text("Bank Name:", bankColX, bankY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(bank.bankName, bankColX + 38, bankY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 50, 0);
        doc.text("Branch:", bankColX + bankColWidth, bankY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(bank.branchName, bankColX + bankColWidth + 32, bankY);

        bankY += 8;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 50, 0);
        doc.text("Account No:", bankColX, bankY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(bank.accountNumber, bankColX + 43, bankY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 50, 0);
        doc.text("IFSC:", bankColX + bankColWidth, bankY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(bank.ifscCode, bankColX + bankColWidth + 27, bankY);

        currentY += 38;
      }

      // Footer with improved design
      doc.setLineWidth(1);
      doc.setDrawColor(30, 58, 95);
      doc.line(margin, pageHeight - 60, pageWidth - margin, pageHeight - 60);

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("* This is a system generated payment voucher.", margin, pageHeight - 50);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 44);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 95);
      doc.text("For Hansaria Food Pvt. Ltd.", pageWidth - margin - 5, pageHeight - 35, {
        align: "right",
      });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Authorised Signatory", pageWidth - margin - 5, pageHeight - 20, {
        align: "right",
      });
      
      doc.setLineWidth(1);
      doc.line(
        pageWidth - margin - 100,
        pageHeight - 25,
        pageWidth - margin - 5,
        pageHeight - 25,
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
                          className="px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
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
                      className="px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-bold transition shadow"
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
