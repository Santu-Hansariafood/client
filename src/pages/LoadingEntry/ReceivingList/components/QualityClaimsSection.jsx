import React from "react";

const QualityClaimsSection = ({ qualityClaims }) => {
  if (!qualityClaims || qualityClaims.length === 0) {
    return null;
  }

  return (
    <div className="lux-card lux-gold-top p-5 sm:p-6">
      <h4 className="mb-6 flex items-center gap-3 font-serif text-lg font-semibold text-lux-ink">
        <span className="w-2 h-2 rounded-full bg-lux-gold" />
        Quality Parameters & Claims
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="rounded-t-2xl bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald">
              <th className="rounded-tl-2xl px-4 py-3 text-left font-serif text-xs font-bold uppercase tracking-wider text-lux-gold-soft">
                Quality Parameter
              </th>
              <th className="px-4 py-3 text-left font-serif text-xs font-bold uppercase tracking-wider text-lux-gold-soft">
                Standard Value
              </th>
              <th className="px-4 py-3 text-left font-serif text-xs font-bold uppercase tracking-wider text-lux-gold-soft">
                Actual Value
              </th>
              <th className="px-4 py-3 text-left font-serif text-xs font-bold uppercase tracking-wider text-lux-gold-soft">
                Difference
              </th>
              <th className="px-4 py-3 text-left font-serif text-xs font-bold uppercase tracking-wider text-lux-gold-soft">
                Claim Amount
              </th>
              <th className="rounded-tr-2xl px-4 py-3 text-left font-serif text-xs font-bold uppercase tracking-wider text-lux-gold-soft">
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
                  className="border-b border-[#ece4d2] odd:bg-lux-cream even:bg-[#f2eee2]/50 transition-colors hover:bg-lux-ivory"
                >
                  <td className="px-4 py-3 font-semibold text-lux-ink">
                    {claim.parameterName || "-"}
                  </td>
                  <td className="px-4 py-3 font-mono text-lux-muted">
                    {standard.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 font-bold text-lux-ink">
                    {actual.toFixed(2)}%
                  </td>
                  <td
                    className={`px-4 py-3 font-mono font-bold ${difference >= 0 ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {difference >= 0 ? "+" : ""}
                    {difference.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-lux-emerald">
                      ₹ {Number(claim.claimAmount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 italic text-lux-muted">
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
