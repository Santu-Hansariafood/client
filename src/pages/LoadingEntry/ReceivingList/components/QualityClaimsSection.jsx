import React from "react";

const QualityClaimsSection = ({ qualityClaims }) => {
  if (!qualityClaims || qualityClaims.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm">
      <h4 className="text-base font-black text-indigo-900 mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        Quality Parameters & Claims
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-100/50 border border-indigo-200 rounded-t-2xl">
              <th className="px-4 py-3 font-bold text-indigo-800 text-left rounded-tl-2xl">
                Quality Parameter
              </th>
              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                Standard Value
              </th>
              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                Actual Value
              </th>
              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                Difference
              </th>
              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                Claim Amount
              </th>
              <th className="px-4 py-3 font-bold text-indigo-800 text-left rounded-tr-2xl">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {qualityClaims.map((claim, index) => {
              const standard = Number(claim.standardValue || 0);
              const actual = Number(claim.actualValue || 0);
              const difference = actual - standard;

              return (
                <tr
                  key={index}
                  className="border border-indigo-100 bg-white hover:bg-indigo-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {claim.parameterName || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {standard.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-bold">
                    {actual.toFixed(2)}%
                  </td>
                  <td
                    className={`px-4 py-3 font-mono font-bold ${difference >= 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {difference >= 0 ? "+" : ""}
                    {difference.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-indigo-700">
                      ₹ {Number(claim.claimAmount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 italic">
                    {claim.notes || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualityClaimsSection;
