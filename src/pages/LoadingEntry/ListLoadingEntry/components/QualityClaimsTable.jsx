import { toast } from "react-toastify";

const getClaimRatio = (claim, currentCompany, currentSelfOrder) => {
  if (!claim.paramValues || claim.paramValues.length === 0) {
    return { left: 1, right: 1, display: "1:1" };
  }

  const ratioValue =
    claim.paramValues.find((v) => v.baseValue) || claim.paramValues[0];
  if (ratioValue) {
    const left = parseFloat(ratioValue.claimRatioLeft) || 1;
    const right = parseFloat(ratioValue.claimRatioRight) || 1;
    return { left, right, display: `${left}:${right}` };
  }

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
  standardValue,
  saudaRate,
  manualRate,
  weight,
) => {
  if (!actualValue || !standardValue) return 0;

  let totalClaim = 0;
  const actual = parseFloat(actualValue);
  const standard = parseFloat(standardValue);
  const difference = actual - standard;

  if (difference > 0) {
    const effectiveRate = parseFloat(manualRate) || saudaRate;

    let ratioLeft = 1;
    let ratioRight = 1;

    if (paramValues && paramValues.length > 0) {
      const ratioValue = paramValues.find((v) => v.baseValue) || paramValues[0];
      if (ratioValue) {
        ratioLeft = parseFloat(ratioValue.claimRatioLeft) || 1;
        ratioRight = parseFloat(ratioValue.claimRatioRight) || 1;
      }
    }

    if (ratioRight > 0 && effectiveRate > 0 && weight > 0) {
      totalClaim =
        (difference / 100) * effectiveRate * (ratioLeft / ratioRight) * weight;
    }
  }

  return Math.abs(totalClaim);
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

  const validClaims = editEntry.qualityClaims.filter((claim) => {
    if (editEntry.showAllQualityParameters) return true;
    const standardValue =
      claim.standardValue ||
      claim.paramValues?.find((v) => v.baseValue)?.baseValue ||
      0;
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
              <span className="font-bold">
                ₹{editEntry.manualCalculationRate}/-
              </span>
            </div>
          )}
          <div className="text-slate-600">
            <span className="font-medium">
              Unloading Amount (for calculation):{" "}
            </span>
            <span className="font-bold">₹{unloadingAmountForCalculation}</span>
          </div>
        </div>
      </h4>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 font-bold text-slate-700">
              Quality Parameter
            </th>
            <th className="px-4 py-3 font-bold text-slate-700">
              Standard Value
            </th>
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
            const ratio = getClaimRatio(
              claim,
              currentCompany,
              currentSelfOrder,
            );
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
                        handleQualityChange(
                          originalIndex,
                          "standardValue",
                          e.target.value,
                        )
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
                      handleQualityChange(
                        originalIndex,
                        "actualValue",
                        e.target.value,
                      )
                    }
                    onBlur={() => {
                      const baseValue =
                        claim.paramValues?.find((v) => v.baseValue)
                          ?.baseValue ||
                        claim.paramValues?.[0]?.baseValue ||
                        claim.standardValue ||
                        0;
                      const actualNum = parseFloat(claim.actualValue);
                      const baseNum = parseFloat(baseValue);
                      if (
                        !isNaN(actualNum) &&
                        !isNaN(baseNum) &&
                        actualNum < baseNum
                      ) {
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
                  <span
                    className={`font-bold ${difference >= 0 ? "text-red-600" : "text-green-600"}`}
                  >
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
                    onChange={(e) =>
                      handleQualityChange(
                        originalIndex,
                        "notes",
                        e.target.value,
                      )
                    }
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
