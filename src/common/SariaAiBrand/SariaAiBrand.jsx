/** Shared saria.ai wordmark for dashboards and AI surfaces */
const SariaAiBrand = ({
  size = "md",
  subtitle,
  light = false,
  className = "",
}) => {
  const sizes = {
    sm: { title: "text-lg", dot: "text-sm", sub: "text-[9px]" },
    md: { title: "text-2xl sm:text-3xl", dot: "text-xl sm:text-2xl", sub: "text-[10px] sm:text-xs" },
    lg: { title: "text-3xl sm:text-4xl", dot: "text-2xl sm:text-3xl", sub: "text-xs sm:text-sm" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={className}>
      <p
        className={`font-black tracking-tight leading-none ${s.title} ${
          light ? "text-white" : "text-slate-900"
        }`}
      >
        saria
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400">
          .ai
        </span>
      </p>
      {subtitle && (
        <p
          className={`${s.sub} font-bold uppercase tracking-[0.2em] mt-1.5 ${
            light ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SariaAiBrand;
