import React from "react";

const BillCalculationSection = ({ selectedEntry, cdValue, gstValue }) => {
  if (!selectedEntry) return null;

  const weight = (selectedEntry.unloadingWeight && selectedEntry.unloadingWeight > 0) ? selectedEntry.unloadingWeight : selectedEntry.loadingWeight || 0;
  const grossAmount = weight * (selectedEntry.actualRate || 0);
  const cdAmount = grossAmount * (cdValue / 100);
  const afterCD = grossAmount - cdAmount;
  const gstAmount = afterCD * (gstValue / 100);
  const totalBillAmount = afterCD + gstAmount;

  const qualityClaims = selectedEntry.qualityClaims?.reduce(
    (sum, c) => sum + (Number(c.claimAmount) || 0),
    0
  ) || 0;
  const secondClaim = Number(selectedEntry.secondClaim || 0);
  const otherCharges = Number(selectedEntry.otherCharges || 0);
  const bankCharges = Number(selectedEntry.bankCharges || 200);
  const totalDeductions = qualityClaims + secondClaim + otherCharges + bankCharges;
  const payableAmount = totalBillAmount - totalDeductions;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
      <h4 className="text-base font-black text-emerald-900 mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Bill & Payable Calculation
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
            <span className="font-semibold text-slate-700">Gross Amount</span>
            <span className="text-lg font-black text-emerald-700">
              ₹ {grossAmount.toFixed(2)}
            </span>
          </div>
          {cdValue > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-yellow-100">
              <span className="font-semibold text-slate-700">
                Less: CD ({cdValue.toFixed(1)}%)
              </span>
              <span className="text-lg font-bold text-yellow-600">
                - ₹ {cdAmount.toFixed(2)}
              </span>
            </div>
          )}
          {cdValue > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-cyan-100">
              <span className="font-semibold text-slate-700">After CD</span>
              <span className="text-lg font-bold text-cyan-700">
                ₹ {afterCD.toFixed(2)}
              </span>
            </div>
          )}
          {gstValue > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-pink-100">
              <span className="font-semibold text-slate-700">
                Add: GST ({gstValue.toFixed(1)}%)
              </span>
              <span className="text-lg font-bold text-pink-600">
                + ₹ {gstAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
            <span className="font-semibold text-slate-700">Total Bill Amount</span>
            <span className="text-lg font-black text-emerald-700">
              ₹ {totalBillAmount.toFixed(2)}
            </span>
          </div>
          {qualityClaims > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100">
              <span className="font-semibold text-slate-700">
                Less Total Quality Claim
              </span>
              <span className="text-lg font-bold text-amber-600">
                - ₹ {qualityClaims.toFixed(2)}
              </span>
            </div>
          )}
          {secondClaim > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-purple-100">
              <span className="font-semibold text-slate-700">
                Less Second Claim
              </span>
              <span className="text-lg font-bold text-purple-600">
                - ₹ {secondClaim.toFixed(2)}
              </span>
            </div>
          )}
          {otherCharges > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-teal-100">
              <span className="font-semibold text-slate-700">
                Less Other Charges
              </span>
              <span className="text-lg font-bold text-teal-600">
                - ₹ {otherCharges.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-orange-100">
            <span className="font-semibold text-slate-700">
              Less Bank Charges
            </span>
            <span className="text-lg font-bold text-orange-600">
              - ₹ {bankCharges.toFixed(2)}
            </span>
          </div>
          {selectedEntry.generalRemarks && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Remarks
              </span>
              <p className="text-slate-700">{selectedEntry.generalRemarks}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg w-full">
            <span className="text-base font-bold text-white block mb-2">
              Payable Amount
            </span>
            <span className="text-3xl font-black text-white">
              ₹ {payableAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCalculationSection;
