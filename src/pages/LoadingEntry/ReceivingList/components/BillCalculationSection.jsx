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
      color: "text-lux-ink",
      bg: "bg-lux-cream",
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
    <div className="lux-card lux-gold-top p-5 sm:p-6">
      <h4 className="mb-6 flex items-center gap-3 font-serif text-lg font-semibold text-lux-ink">
        <span className="w-2 h-2 rounded-full bg-lux-gold" />
        Bill & Payable Calculation - Purpose-wise Breakdown
      </h4>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-[#ece4d2] bg-lux-ivory">
          <div className="grid grid-cols-12 gap-2 border-b border-[#ece4d2] bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald px-4 py-2.5 font-serif text-[10px] font-black uppercase tracking-wider text-lux-gold-soft">
            <div className="col-span-1 text-center">+/-</div>
            <div className="col-span-5">Particulars & Purpose</div>
            <div className="col-span-4">Detail / Remarks</div>
            <div className="col-span-2 text-right">Amount (Rs)</div>
          </div>
          {breakdownItems.map((item, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 gap-2 border-b border-[#ece4d2] px-4 py-3 ${item.bg} last:border-b-0 transition-all hover:brightness-95`}
            >
              <div className="col-span-1 flex items-center justify-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#ece4d2] bg-lux-cream text-sm font-black shadow-sm ${item.signColor}`}
                >
                  {item.sign}
                </span>
              </div>
              <div className="col-span-5 flex items-center">
                <span className={`text-sm font-bold ${item.color}`}>
                  {item.label}
                </span>
              </div>
              <div className="col-span-4 flex items-center">
                <span className="text-[10px] font-semibold leading-snug text-lux-muted">
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
          <div className="grid grid-cols-12 gap-2 border-t-2 border-[#ece4d2] bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald px-4 py-4 text-lux-gold-soft">
            <div className="col-span-10 flex items-center">
              <span className="text-[10px] font-black uppercase tracking-wider leading-tight">
                Net Payable = Gross - CD - Claims - BankChgs - 2ndClaim - Others - TDS + GST
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <span className="text-xl font-black tabular-nums sm:text-2xl">
                = Rs {payableAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {selectedEntry.generalRemarks && (
          <div className="mt-4 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4">
            <span className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">
              General Remarks
            </span>
            <p className="text-sm font-medium text-lux-ink">
              {selectedEntry.generalRemarks}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
              <span className="text-xs font-semibold text-lux-muted">Gross Amount</span>
              <span className="text-base font-black text-lux-emerald">
                Rs {grossAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
              <span className="text-xs font-semibold text-lux-muted">Total Bill</span>
              <span className="text-base font-black text-lux-emerald">
                Rs {totalBillAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
              <span className="text-xs font-semibold text-lux-muted">Total Quality Claim</span>
              <span className="text-base font-bold text-emerald-600">
                Rs {qualityClaimsTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
              <span className="text-xs font-semibold text-lux-muted">Second Claim</span>
              <span className="text-base font-bold text-violet-600">
                Rs {secondClaim.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
              <span className="text-xs font-semibold text-lux-muted">Other Charges</span>
              <span className="text-base font-bold text-teal-600">
                Rs {otherCharges.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ece4d2] bg-lux-cream p-3">
              <span className="text-xs font-semibold text-lux-muted">Bank Charges</span>
              <span className="text-base font-bold text-amber-600">
                Rs {bankCharges.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full rounded-3xl bg-gradient-to-br from-lux-emerald to-lux-deep p-8 text-center shadow-2xl ring-1 ring-lux-gold/30">
              <span className="mb-3 block font-serif text-xs font-bold uppercase tracking-[0.2em] text-lux-gold-soft/80">
                Final Payable Amount
              </span>
              <span className="text-3xl font-black tabular-nums text-lux-gold-soft drop-shadow-lg sm:text-4xl">
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
