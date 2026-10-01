import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const MisStatCard = ({
  icon,
  label,
  value,
  subValue,
  accent = "slate",
  trend,
}) => {
  const accents = {
    slate: {
      bg: "from-slate-50 to-white",
      border: "border-slate-200/80",
      iconBg: "from-slate-500 to-slate-600",
      iconGlow: "shadow-slate-500/20",
      labelColor: "text-slate-500",
      valueColor: "text-slate-900",
      accentBar: "from-slate-400 to-slate-600",
    },
    emerald: {
      bg: "from-emerald-50/80 via-green-50/50 to-white",
      border: "border-emerald-200",
      iconBg: "from-emerald-500 to-[#047857]",
      iconGlow: "shadow-emerald-500/25",
      labelColor: "text-emerald-700/80",
      valueColor: "text-emerald-900",
      accentBar: "from-emerald-400 to-[#065f46]",
    },
    blue: {
      bg: "from-blue-50/80 via-sky-50/50 to-white",
      border: "border-blue-200",
      iconBg: "from-blue-500 to-blue-700",
      iconGlow: "shadow-blue-500/25",
      labelColor: "text-blue-700/80",
      valueColor: "text-blue-900",
      accentBar: "from-blue-400 to-blue-700",
    },
    green: {
      bg: "from-green-50/80 via-lime-50/40 to-white",
      border: "border-green-200",
      iconBg: "from-green-500 to-emerald-700",
      iconGlow: "shadow-green-500/25",
      labelColor: "text-green-700/80",
      valueColor: "text-green-900",
      accentBar: "from-green-400 to-green-700",
    },
    navy: {
      bg: "from-[#1e3a5f]/5 via-slate-50 to-white",
      border: "border-[#1e3a5f]/20",
      iconBg: "from-[#1e3a5f] to-[#2d4a6f]",
      iconGlow: "shadow-[#1e3a5f]/25",
      labelColor: "text-[#1e3a5f]/80",
      valueColor: "text-[#0f2847]",
      accentBar: "from-[#2d4a6f] to-[#1e3a5f]",
    },
    rose: {
      bg: "from-rose-50/80 via-red-50/40 to-white",
      border: "border-rose-200",
      iconBg: "from-rose-500 to-red-700",
      iconGlow: "shadow-rose-500/25",
      labelColor: "text-rose-700/80",
      valueColor: "text-rose-900",
      accentBar: "from-rose-400 to-red-700",
    },
    amber: {
      bg: "from-amber-50/80 via-yellow-50/40 to-white",
      border: "border-amber-200",
      iconBg: "from-amber-400 to-[#d97706]",
      iconGlow: "shadow-amber-500/25",
      labelColor: "text-amber-700/80",
      valueColor: "text-amber-900",
      accentBar: "from-amber-300 to-[#b45309]",
    },
  };

  const palette = accents[accent] || accents.slate;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-gradient-to-br ${palette.bg} ${palette.border} shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.09)] hover:-translate-y-0.5`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${palette.accentBar}`}
      />

      <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full opacity-[0.04]">
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${palette.iconBg}`}
        />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`relative p-3 rounded-2xl bg-gradient-to-br ${palette.iconBg} text-white shadow-lg ${palette.iconGlow} transition-transform duration-300 group-hover:scale-105`}
          >
            <div className="absolute inset-0 rounded-2xl bg-white/10" />
            <div className="relative text-lg">{icon}</div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {trend !== undefined && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  trend >= 0
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-rose-500/15 text-rose-700"
                }`}
              >
                {trend >= 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                {Math.abs(trend)}%
              </span>
            )}
            {subValue && (
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${palette.labelColor} bg-white/60 border-white/80 backdrop-blur-sm`}
              >
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${palette.labelColor}`}
          >
            {label}
          </p>
          <p
            className={`text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight ${palette.valueColor}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MisStatCard;
