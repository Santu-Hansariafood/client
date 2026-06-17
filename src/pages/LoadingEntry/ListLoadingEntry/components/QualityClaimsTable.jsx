import React from "react";
import { toast } from "react-toastify";

const getClaimRatio = (claim, currentCompany, currentSelfOrder) => {
  if (!claim.paramValues || claim.paramValues.length === 0) {
    return { left: 1, right: 1, display: "1:1" };
  }

  // Find first value with baseValue
  const ratioValue = claim.paramValues.find((v) => v.baseValue) || claim.paramValues[0];
  if (ratioValue) {
    const left = parseFloat(ratioValue.claimRatioLeft) || 1;
    const right = parseFloat(ratioValue.claimRatioRight) || 1;
    return { left, right, display: `${left}:${right}` };
  }

  // Fallback to company commodity params
  if (
    currentCompany &&
    currentCompany.commodities &&
    currentSelfOrder &&
    currentSelfOrder.commodity
  ) {
    const commodity = currentCompany.commodities.find(
      (c) => c.name.toLowerCase() === currentSelfOrder.commodity.toLowerCase(),
    );
    if (commodity && commodity.parameters) {
      const param = commodity.parameters.find(
        (p) =>
          String(p.parameterId) === String(claim.parameterId) ||
          p.parameter?.toLowerCase() === claim.parameterName?.toLowerCase(),
      );
      if (param && param.values?.length) {
        const ratioVal = param.values[0];
        const left = parseFloat(ratioVal.claimRatioLeft) || 1;
        const right = parseFloat(ratioVal.claimRatioRight) || 1;
        return { left, right, display: `${left}:${right}` };
      }
    }
  }

  return { left: 1, right: 1, display: "1:1" };
};

const calculateClaimAmount = (
  paramValues,
  actualValue,
  saudaRate,
  manualRate,
  weight,
) => {
  if (!paramValues || paramValues.length === 0) return 0;

  let totalClaim = 0;
  let remainingActual = actualValue;
  const effectiveRate = parseFloat(manualRate) || saudaRate;

  const sortedRanges = [...paramValues].sort((a, b) => {
    const aBase = parseFloat(a.baseValue) || 0;
    const bBase = parseFloat(b.baseValue) || 0;
    return aBase - bBase;
  });

  for (let i = 0; i < sortedRanges.length; i++) {
    const range = sortedRanges[i];
    const base = parseFloat(range.baseValue) || 0;
    const max = parseFloat(range.maxValue) || Infinity;
    const ratioLeft = parseFloat(range.claimRatioLeft) || 1;
    const ratioRight = parseFloat(range.claimRatioRight) || 1;

    if (remainingActual <= base) break;

    const rangeStart =
      i === 0
        ? base
        : parseFloat(sortedRanges[i - 1].maxValue || sortedRanges[i - 1].baseValue);
    const rangeEnd = max;
    const amountInRange = Math.min(remainingActual, rangeEnd) - rangeStart;

    if (amountInRange > 0 && ratioRight > 0) {
      totalClaim +=
        (amountInRange / 100) * effectiveRate * (ratioLeft / ratioRight) * weight;
      remainingActual -= amountInRange;
    }

    if (remainingActual <= rangeEnd) break;
  }

  if (remainingActual > 0 && sortedRanges.length > 0) {
    const lastRange = sortedRanges[sortedRanges.length - 1];
    const lastRatioLeft = parseFloat(lastRange.claimRatioLeft) || 1;
    const lastRatioRight = parseFloat(lastRange.claimRatioRight) || 1;
    const lastMax =
      parseFloat(lastRange.maxValue) || parseFloat(lastRange.baseValue);

    const excessAmount = remainingActual - lastMax;
    if (excessAmount > 0 && lastRatioRight > 0) {
      totalClaim +=
        (excessAmount / 100) * effectiveRate * (lastRatioLeft / lastRatioRight) * weight;
    }
  }

  return totalClaim;
};

const QualityClaimsTable = ({
  editEntry,
  currentSelfOrder,
  currentCompany,
  handleQualityChange,
}) => {
  if (!editEntry.qualityClaims || editEntry.qualityClaims.length === 0) {
    return null;
  }

  // Filter out claims with empty or zero standard values only if showAllQualityParameters is false
  const validClaims = editEntry.qualityClaims.filter(claim => {
    if (editEntry.showAllQualityParameters) return true;
    const standardValue = claim.standardValue || claim.paramValues?.find(v => v.baseValue)?.baseValue || 0;
    return parseFloat(standardValue) > 0;
  });

  if (validClaims.length === 0) {
    return null;
  }

  const effectiveRate =
    parseFloat(editEntry.manualCalculationRate) ||
    parseFloat(currentSelfOrder?.rate || 0);
  const weight = parseFloat(editEntry.unloadingWeight || 0);
  const unloadingAmountForCalculation = effectiveRate * weight;

  return (
    <div className="border-t border-slate-200 pt-6 mt-6 overflow-x-auto">
      <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Quality Parameters & Claims
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-slate-600">
            <span className="font-medium">Actual Rate: </span>
            <span className="font-bold">₹{currentSelfOrder?.rate || 0}/-</span>
          </div>
          {editEntry.manualCalculationRate && (
            <div className="text-slate-600">
              <span className="font-medium">Manual Calculation Rate: </span>
              <span className="font-bold">₹{editEntry.manualCalculationRate}/-</span>
            </div>
          )}
          <div className="text-slate-600">
            <span className="font-medium">Unloading Amount (for calculation): </span>
            <span className="font-bold">₹{unloadingAmountForCalculation}</span>
          </div>
        </div>
      </h4>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 font-bold text-slate-700">Quality Parameter</th>
            <th className="px-4 py-3 font-bold text-slate-700">Standard Value</th>
            <th className="px-4 py-3 font-bold text-slate-700">Actual Value</th>
            <th className="px-4 py-3 font-bold text-slate-700">Difference</th>
            <th className="px-4 py-3 font-bold text-slate-700">Claim Ratio</th>
            {/* <th className="px-4 py-3 font-bold text-slate-700">Claim %</th> */}
            <th className="px-4 py-3 font-bold text-slate-700">Claim Amount</th>
            <th className="px-4 py-3 font-bold text-slate-700">Notes</th>
          </tr>
        </thead>
        <tbody>
          {validClaims.map((claim, idx) => {
            const originalIndex = editEntry.qualityClaims.indexOf(claim);
            const ratio = getClaimRatio(claim, currentCompany, currentSelfOrder);
            let claimPercent = 0;
            const baseValue =
              claim.paramValues?.find((v) => v.baseValue)?.baseValue ||
              claim.paramValues?.[0]?.baseValue ||
              claim.standardValue ||
              0;
            const standard = Number(baseValue);
            const actual = Number(claim.actualValue) || 0;
            const difference = actual - standard;
            const claimAmt = Number(claim.claimAmount) || 0;
            const totalValue = effectiveRate * weight;

            if (totalValue > 0) {
              claimPercent = (claimAmt / totalValue) * 100;
            }

            const displayStandardValue =
              claim.paramValues?.find((v) => v.baseValue)?.baseValue ||
              claim.paramValues?.[0]?.baseValue ||
              claim.standardValue ||
              0;

            return (
              <tr
                key={originalIndex}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {claim.parameterName}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={claim.standardValue}
                      onChange={(e) =>
                        handleQualityChange(originalIndex, "standardValue", e.target.value)
                      }
                      placeholder="Standard"
                      disabled={editEntry.manualClaim}
                      className={`w-24 px-3 py-1.5 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        editEntry.manualClaim
                          ? "bg-slate-100 border-slate-200 cursor-not-allowed"
                          : "bg-white border-slate-300"
                      }`}
                      step="0.01"
                    />
                    <span className="text-slate-600 font-bold">%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={claim.actualValue}
                    onChange={(e) =>
                      handleQualityChange(originalIndex, "actualValue", e.target.value)
                    }
                    onBlur={() => {
                      const baseValue =
                        claim.paramValues?.find((v) => v.baseValue)?.baseValue ||
                        claim.paramValues?.[0]?.baseValue ||
                        claim.standardValue ||
                        0;
                      const actualNum = parseFloat(claim.actualValue);
                      const baseNum = parseFloat(baseValue);
                      if (!isNaN(actualNum) && !isNaN(baseNum) && actualNum < baseNum) {
                        toast.error(
                          `Actual value must be greater than base value (${baseNum})`,
                        );
                      }
                    }}
                    placeholder="Actual"
                    disabled={editEntry.manualClaim}
                    className={`w-24 px-3 py-1.5 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      editEntry.manualClaim
                        ? "bg-slate-100 border-slate-200 cursor-not-allowed"
                        : "bg-white border-slate-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${difference >= 0 ? "text-red-600" : "text-green-600"}`}>
                    {difference.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-indigo-600 font-black italic">
                  {ratio.display}
                </td>
                {/* <td className="px-4 py-3 text-slate-700 font-bold">
                  {claimPercent.toFixed(2)}%
                </td> */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={claim.claimAmount}
                      readOnly
                      className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-orange-600 outline-none"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={claim.notes}
                    onChange={(e) => handleQualityChange(originalIndex, "notes", e.target.value)}
                    placeholder="Remarks..."
                    disabled={editEntry.manualClaim}
                    className={`w-full min-w-[150px] px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      editEntry.manualClaim
                        ? "bg-slate-100 border-slate-200 cursor-not-allowed"
                        : "bg-white border-slate-300"
                    }`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QualityClaimsTable;
export { getClaimRatio, calculateClaimAmount };
