import React from "react";

const BillCalculationSection = ({ selectedEntry, cdValue, gstValue }) => {
  if (!selectedEntry) return null;

  const weight =
    selectedEntry.unloadingWeight && selectedEntry.unloadingWeight > 0
      ? selectedEntry.unloadingWeight
      : selectedEntry.loadingWeight || 0;
  const rate = Number(selectedEntry.actualRate || 0);
  const cdPercent = Number(cdValue || 0);
  const gstPercent = Number(gstValue || 0);
  const grossAmount = weight * rate;
  const cdAmount = grossAmount * (cdPercent / 100);
  const afterCD = grossAmount - cdAmount;
  const gstAmount = afterCD * (gstPercent / 100);
  const totalBillAmount = afterCD + gstAmount;

  const qualityClaimsList = Array.isArray(selectedEntry.qualityClaims)
    ? selectedEntry.qualityClaims
    : [];
  const qualityClaimsTotal = qualityClaimsList.reduce(
    (sum, c) => sum + (Number(c.claimAmount) || 0),
    0
  ) || 0;
  const secondClaim = Number(selectedEntry.secondClaim || 0);
  const otherCharges = Number(selectedEntry.otherCharges || 0);
  const bankCharges = Number(selectedEntry.bankCharges || 0);
  const tds = Number(selectedEntry.tds || 0);
  const totalDeductions =
    qualityClaimsTotal + secondClaim + otherCharges + bankCharges + tds;
  const payableAmount = totalBillAmount - totalDeductions;

  const buildBreakdown = () => {
    const items = [];
    items.push({
      type: "add",
      label: "Gross Amount",
      detail: `${Number(weight).toFixed(3)} T x Rs${rate.toFixed(2)}/Ton`,
      amount: grossAmount,
      color: "text-slate-700",
      bg: "bg-slate-50",
      sign: "+",
      signColor: "text-emerald-600",
    });
    if (cdAmount > 0) {
      items.push({
        type: "deduct",
        label: `CD (${cdPercent.toFixed(2)}%)`,
        detail: "Cash Discount on Gross",
        amount: cdAmount,
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        sign: "-",
        signColor: "text-red-500",
      });
    }
    if (gstAmount > 0) {
      items.push({
        type: "add",
        label: `GST (${gstPercent.toFixed(2)}%)`,
        detail: `On (Gross - CD) = Rs${afterCD.toFixed(2)}`,
        amount: gstAmount,
        color: "text-pink-700",
        bg: "bg-pink-50",
        sign: "+",
        signColor: "text-emerald-600",
      });
    }

    qualityClaimsList.forEach((claim) => {
      const claimAmt = Number(claim.claimAmount) || 0;
      if (claimAmt > 0) {
        const std =
          claim.standardValue != null
            ? Number(claim.standardValue).toFixed(2)
            : "-";
        const act =
          claim.actualValue != null
            ? Number(claim.actualValue).toFixed(2)
            : "-";
        items.push({
          type: "deduct",
          label: `Claim: ${claim.parameterName || "Unnamed"}`,
          detail: `Std: ${std}% / Act: ${act}%${
            claim.notes ? ` . ${claim.notes}` : ""
          }`,
          amount: claimAmt,
          color: "text-red-700",
          bg: "bg-red-50",
          sign: "-",
          signColor: "text-red-500",
        });
      }
    });

    if (secondClaim > 0) {
      items.push({
        type: "deduct",
        label: "2nd Claim",
        detail: selectedEntry.secondClaimRemarks || "Secondary deduction",
        amount: secondClaim,
        color: "text-purple-700",
        bg: "bg-purple-50",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    if (otherCharges > 0) {
      items.push({
        type: "deduct",
        label: "Other Charges",
        detail: selectedEntry.otherChargesRemarks || "Miscellaneous charges",
        amount: otherCharges,
        color: "text-teal-700",
        bg: "bg-teal-50",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    if (bankCharges > 0) {
      items.push({
        type: "deduct",
        label: "Bank Charges",
        detail: selectedEntry.bankChargesRemarks || "Bank processing charges",
        amount: bankCharges,
        color: "text-orange-700",
        bg: "bg-orange-50",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    if (tds > 0) {
      items.push({
        type: "deduct",
        label: "TDS",
        detail: selectedEntry.tdsRemarks || "Tax Deducted at Source",
        amount: tds,
        color: "text-rose-800",
        bg: "bg-rose-50",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    return items;
  };

  const breakdownItems = buildBreakdown();

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
      <h4 className="text-base font-black text-emerald-900 mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Bill & Payable Calculation - Purpose-wise Breakdown
      </h4>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
            <div className="col-span-1 text-center">+/-</div>
            <div className="col-span-5">Particulars & Purpose</div>
            <div className="col-span-4">Detail / Remarks</div>
            <div className="col-span-2 text-right">Amount (Rs)</div>
          </div>
          {breakdownItems.map((item, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-100 ${item.bg} last:border-b-0 hover:brightness-95 transition-all`}
            >
              <div className="col-span-1 flex items-center justify-center">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${item.signColor} bg-white/70 shadow-sm border`}
                >
                  {item.sign}
                </span>
              </div>
              <div className="col-span-5 flex items-center">
                <span className={`text-sm font-black ${item.color}`}>
                  {item.label}
                </span>
              </div>
              <div className="col-span-4 flex items-center">
                <span className="text-[10px] font-semibold text-slate-500 leading-snug">
                  {item.detail}
                </span>
              </div>
              <div
                className={`col-span-2 flex items-center justify-end ${item.color}`}
              >
                <span className="text-sm font-black tabular-nums">
                  {item.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-12 gap-2 px-4 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white border-t-2 border-emerald-700">
            <div className="col-span-10 flex items-center">
              <span className="text-[10px] font-black uppercase tracking-wider leading-tight">
                Net Payable = Gross - CD - Claims - BankChgs - 2ndClaim - Others - TDS + GST
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <span className="text-2xl font-black tabular-nums">
                = Rs {payableAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {selectedEntry.generalRemarks && (
          <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">
              General Remarks
            </span>
            <p className="text-sm text-slate-700 font-medium">
              {selectedEntry.generalRemarks}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
              <span className="font-semibold text-slate-700 text-xs">Gross Amount</span>
              <span className="text-base font-black text-emerald-700">
                Rs {grossAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
              <span className="font-semibold text-slate-700 text-xs">Total Bill</span>
              <span className="text-base font-black text-emerald-700">
                Rs {totalBillAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-100">
              <span className="font-semibold text-slate-700 text-xs">Total Quality Claim</span>
              <span className="text-base font-bold text-green-600">
                Rs {qualityClaimsTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-purple-100">
              <span className="font-semibold text-slate-700 text-xs">Second Claim</span>
              <span className="text-base font-bold text-purple-600">
                Rs {secondClaim.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-teal-100">
              <span className="font-semibold text-slate-700 text-xs">Other Charges</span>
              <span className="text-base font-bold text-teal-600">
                Rs {otherCharges.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-orange-100">
              <span className="font-semibold text-slate-700 text-xs">Bank Charges</span>
              <span className="text-base font-bold text-orange-600">
                Rs {bankCharges.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl w-full text-center">
              <span className="text-xs font-bold text-white/80 uppercase tracking-[0.2em] block mb-3">
                Final Payable Amount
              </span>
              <span className="text-4xl font-black text-white drop-shadow-lg tabular-nums">
                Rs {payableAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCalculationSection;
