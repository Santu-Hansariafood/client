const MisStatCard = ({
  icon,
  label,
  value,
  subValue,
  accent = "slate",
}) => {
  const accents = {
    slate: "from-slate-500/10 to-slate-500/5 border-slate-200 text-slate-700",
    emerald:
      "from-emerald-500/15 to-emerald-500/5 border-emerald-200/80 text-emerald-700",
    blue: "from-blue-500/15 to-blue-500/5 border-blue-200/80 text-blue-700",
    amber:
      "from-amber-500/15 to-amber-500/5 border-amber-200/80 text-amber-700",
    navy: "from-[#1e3a5f]/15 to-[#1e3a5f]/5 border-[#1e3a5f]/20 text-[#1e3a5f]",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${accents[accent] || accents.slate}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`p-2.5 rounded-xl bg-white/80 shadow-sm border border-white/60 ${accents[accent]?.split(" ").pop()}`}
        >
          {icon}
        </div>
        {subValue && (
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/60 px-2 py-1 rounded-md border border-slate-100">
            {subValue}
          </span>
        )}
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
};

export default MisStatCard;
