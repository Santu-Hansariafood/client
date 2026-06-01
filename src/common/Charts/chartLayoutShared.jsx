/** Responsive layout primitives for dashboard chart panels. */

/** Chart plot area — scales with viewport, capped for large screens. */
export const CHART_AREA_CLASS =
  "w-full min-h-[200px] h-[clamp(200px,48vw,380px)] sm:min-h-[240px]";

export const CHART_LOADING_CLASS = `${CHART_AREA_CLASS} flex items-center justify-center`;

export const ChartSpinner = ({ colorClass = "border-indigo-600" }) => (
  <div
    className={`animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-2 ${colorClass}`}
    role="status"
    aria-label="Loading chart"
  />
);

/**
 * Standard chart card header used inside Market Intelligence panels.
 */
export const ChartPanelHeader = ({
  accentClass = "bg-indigo-600",
  title,
  highlight,
  subtitle,
  children,
}) => (
  <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
      <div className="min-w-0 flex-1">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 sm:w-2 h-3.5 sm:h-4 shrink-0 ${accentClass} rounded-full`}
          />
          <span className="truncate">
            {title}
            {highlight != null && (
              <>
                {" "}
                <span className={highlight.className}>{highlight.text}</span>
              </>
            )}
          </span>
        </h3>
        {subtitle && (
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="shrink-0 w-full sm:w-auto min-w-0">{children}</div>
      )}
    </div>
  </div>
);

/** Horizontally scrollable period / filter toggles on narrow screens. */
export const ChartPeriodToggle = ({ options, value, onChange, activeClass }) => (
  <div className="w-full sm:w-auto overflow-x-auto -mx-1 px-1 pb-0.5">
    <div className="inline-flex min-w-max bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-inner">
      {options.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black transition-all duration-300 uppercase tracking-widest whitespace-nowrap ${
            value === type ? activeClass : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  </div>
);

/** Recharts XAxis props that reduce label clutter on small screens. */
export const RESPONSIVE_X_AXIS_PROPS = {
  minTickGap: 12,
  interval: "preserveStartEnd",
};
