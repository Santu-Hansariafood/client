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
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 15, {
        align: "center",
      });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106",
        pageWidth / 2,
        20,
        { align: "center" },
      );

      doc.setLineWidth(0.5);
      doc.line(margin, 25, pageWidth - margin, 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("LEDGER VOUCHER", margin, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Printed on: ${new Date().toLocaleString()}`,
        pageWidth - margin,
        32,
        { align: "right" },
      );

      doc.line(margin, 35, pageWidth - margin, 35);

      let currentY = 40;

      const tableData = [];
      tableData.push([
        row.date ? new Date(row.date).toLocaleDateString("en-GB") : "—",
        row.particulars.toUpperCase(),
        (row.buyerCompany || "-").toUpperCase(),
        (row.supplierCompany || "-").toUpperCase(),
        row.vchType.toUpperCase(),
        row.debit > 0 ? `Rs. ${Number(row.debit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
        row.credit > 0 ? `Rs. ${Number(row.credit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
        `Rs. ${Number(row.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        "",
        "",
      ]);

      const hasClaims = row.raw?.qualityClaims && row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;
      if (hasClaims) {
        const validClaims = row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0);
        validClaims.forEach((claim) => {
          tableData.push([
            "",
            `CLAIM: ${(claim.parameterName || "UNNAMED").toUpperCase()}`,
            "",
            "",
            "",
            "",
            "",
            "",
            (claim.parameterName || "UNNAMED").toUpperCase(),
            `Rs. ${Number(claim.claimAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          ]);
        });
      }

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "DATE",
            "PARTICULARS",
            "BUYER",
            "SELLER",
            "VCH",
            "DEBIT",
            "CREDIT",
            "BALANCE",
            "CLAIM PARAMETER",
            "CLAIM AMOUNT",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [30, 58, 95],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: "bold",
          halign: "center",
        },
        styles: {
          fontSize: 6,
          cellPadding: 1.5,
          valign: "middle",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 18 },
          1: { cellWidth: 70 },
          2: { cellWidth: 28 },
          3: { cellWidth: 28 },
          4: { halign: "center", cellWidth: 15 },
          5: { halign: "right", cellWidth: 22 },
          6: { halign: "right", cellWidth: 22 },
          7: { halign: "right", fontStyle: "bold", cellWidth: 25 },
          8: { cellWidth: 30 },
          9: { halign: "right", cellWidth: 22, textColor: [185, 28, 28] },
        },
        margin: { left: margin, right: margin },
      });

      const finalY = doc.lastAutoTable?.finalY || 70;

      doc.setFontSize(9);
      doc.text("Authorised Signatory", pageWidth - margin, finalY + 20, {
        align: "right",
      });
      doc.line(
        pageWidth - 60,
        finalY + 17,
        pageWidth - margin,
        finalY + 17,
      );

      const fileName = `Ledger_${row.vchType || "Voucher"}_${
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
