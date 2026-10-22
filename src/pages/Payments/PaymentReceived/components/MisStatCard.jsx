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
      iconBg: "from-lux-emerald to-lux-deep",
      iconGlow: "shadow-lux-emerald/25",
      accentBar: "from-[#d9cfb4] to-lux-gold",
    },
    emerald: {
      iconBg: "from-lux-emerald to-lux-deep",
      iconGlow: "shadow-lux-emerald/25",
      accentBar: "from-[#059669] to-[#065f46]",
    },
    blue: {
      iconBg: "from-[#1e3a5f] to-[#2d5a8f]",
      iconGlow: "shadow-[#1e3a5f]/25",
      accentBar: "from-[#2d5a8f] to-[#1e3a5f]",
    },
    green: {
      iconBg: "from-emerald-500 to-lux-deep",
      iconGlow: "shadow-emerald-500/25",
      accentBar: "from-emerald-400 to-emerald-700",
    },
    navy: {
      iconBg: "from-[#1e3a5f] to-[#2d4a6f]",
      iconGlow: "shadow-[#1e3a5f]/25",
      accentBar: "from-[#2d4a6f] to-[#1e3a5f]",
    },
    rose: {
      iconBg: "from-rose-500 to-red-700",
      iconGlow: "shadow-rose-500/25",
      accentBar: "from-rose-400 to-red-700",
    },
    amber: {
      iconBg: "from-amber-400 to-[#d97706]",
      iconGlow: "shadow-amber-500/25",
      accentBar: "from-amber-300 to-[#b45309]",
    },
  };

  const palette = accents[accent] || accents.slate;

  return (
    <div className="group lux-card lux-card-hover lux-sheen relative overflow-hidden p-5">
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${palette.accentBar}`}
      />

      <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full opacity-[0.04]">
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${palette.iconBg}`}
        />
      </div>

      <div className="relative">
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
              <span className="rounded-lg border border-[#e6dcc4] bg-lux-cream px-2 py-1 lux-eyebrow">
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <p className="lux-eyebrow">
            {label}
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-semibold text-lux-ink tabular-nums tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MisStatCard;
