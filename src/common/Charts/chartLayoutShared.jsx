import { useEffect, useState } from "react";
import { FaChartLine } from "react-icons/fa";

/** Responsive layout primitives for dashboard chart panels. */

/** Chart plot area — scales with viewport, capped for large screens. */
export const CHART_AREA_CLASS =
  "relative w-full min-h-[210px] h-[clamp(210px,52vw,400px)] sm:min-h-[250px] transition-all duration-500 ease-out";

export const CHART_LOADING_CLASS = `${CHART_AREA_CLASS} flex items-center justify-center`;

/**
 * Modern animated multi-ring spinner + dots for chart loading states.
 * Matches the luxury emerald/gold visual language.
 */
export const ChartSpinner = ({ colorClass = "border-lux-emerald", subtitle = "Loading data" }) => (
  <div className="flex flex-col items-center gap-3 animate-fade-in">
    <div className="relative flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16">
      <div className="absolute inset-0 rounded-full border border-[#ece4d2] animate-pulseSlow" />
      <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-lux-gold/50 border-r-lux-emerald/40 animate-ring-rotate-reverse" />
      <div
        className={`absolute inset-3 sm:inset-4 rounded-full border-2 border-transparent border-t-current border-r-current ${colorClass} animate-ring-rotate`}
      />
      <div className="absolute rounded-full bg-gradient-to-br from-lux-gold to-lux-emerald animate-pulse h-3.5 w-3.5 sm:h-4 sm:w-4 shadow-md shadow-lux-emerald/40" />
    </div>
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] sm:text-xs font-bold tracking-[0.18em] text-lux-muted uppercase font-display animate-pulse">
        {subtitle}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-gradient-to-br from-lux-emerald to-lux-deep animate-dot-pulse w-2 h-2" style={{ animationDelay: "0ms" }} />
        <span className="rounded-full bg-gradient-to-br from-lux-gold to-lux-gold-soft animate-dot-pulse w-2 h-2" style={{ animationDelay: "160ms" }} />
        <span className="rounded-full bg-gradient-to-br from-lux-night to-lux-deep animate-dot-pulse w-2 h-2" style={{ animationDelay: "320ms" }} />
      </div>
    </div>
  </div>
);

/**
 * Shimmer skeleton for a chart panel — use during the first data fetch
 * so the UI doesn't jump from nothing to a fully-rendered chart.
 */
export const ChartSkeleton = ({ withHeader = true, rows = 5 }) => {
  const barWidths = ["28%", "52%", "76%", "41%", "63%", "35%"];
  return (
    <div className="w-full min-w-0 animate-fade-in">
      {withHeader && (
        <div className="mb-4 sm:mb-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-4 shrink-0 rounded-full bg-gradient-to-b from-lux-gold to-lux-emerald animate-shimmer bg-gradient-to-r from-[#efe9dc] via-[#e5ddc9] to-[#efe9dc] bg-[length:200%_100%]" />
                <div className="h-3.5 w-40 sm:w-56 rounded bg-[#efe9dc] animate-shimmer bg-gradient-to-r from-[#efe9dc] via-[#e5ddc9] to-[#efe9dc] bg-[length:200%_100%]" />
              </div>
              <div className="mt-2 h-2.5 w-64 sm:w-80 rounded bg-[#f2eee2]/70 animate-shimmer bg-gradient-to-r from-[#efe9dc] via-[#e5ddc9] to-[#efe9dc] bg-[length:200%_100%]" />
            </div>
            <div className="shrink-0 h-9 w-48 rounded-xl bg-[#f2eee2] animate-shimmer bg-gradient-to-r from-[#efe9dc] via-[#e5ddc9] to-[#efe9dc] bg-[length:200%_100%]" />
          </div>
        </div>
      )}

      <div className={`${CHART_AREA_CLASS} relative overflow-hidden rounded-2xl bg-gradient-to-br from-lux-cream via-[#f7f4ec] to-lux-cream border border-[#e9e2d3] p-4 sm:p-6`}>
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-x-4 top-4 bottom-10 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-px bg-[#e0d8c6]/70" />
            ))}
          </div>
          <div className="absolute left-4 right-4 bottom-6 flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-8 h-2 rounded bg-[#e5ddc9]/60" />
            ))}
          </div>
        </div>
        <div className="relative z-10 h-full flex items-end justify-around gap-2 sm:gap-4 px-2 pb-10 pt-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="relative flex-1 max-w-[40px] sm:max-w-[56px] rounded-t-2xl animate-shimmer bg-[length:200%_100%] overflow-hidden"
              style={{
                height: barWidths[i % barWidths.length],
                backgroundImage:
                  "linear-gradient(90deg, rgba(6,95,70,0.14), rgba(201,162,39,0.26), rgba(6,95,70,0.14))",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Standard chart card header used inside Market Intelligence panels.
 * Luxury treatment: gold eyebrow, serif title, emerald icon tile.
 */
export const ChartPanelHeader = ({
  accentClass = "bg-gradient-to-b from-lux-gold to-lux-emerald",
  title,
  highlight,
  subtitle,
  children,
  icon: HeaderIcon,
}) => (
  <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0 animate-slide-down">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
      <div className="min-w-0 flex-1">
        <p className="lux-eyebrow mb-1">Analytics</p>
        <h3 className="font-serif text-sm sm:text-base font-semibold text-lux-ink flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 sm:w-2 h-3.5 sm:h-4 shrink-0 ${accentClass} rounded-full shadow-sm animate-glow`}
          />
          {HeaderIcon && (
            <span className="hidden sm:flex shrink-0 w-6 h-6 rounded-lg items-center justify-center bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-sm">
              <HeaderIcon size={12} />
            </span>
          )}
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
          <p className="text-[9px] sm:text-[10px] font-semibold text-lux-muted mt-1 uppercase tracking-tighter line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="shrink-0 w-full sm:w-auto min-w-0 animate-slide-up [animation-delay:80ms]">
          {children}
        </div>
      )}
    </div>
  </div>
);

/** Horizontally scrollable period / filter toggles on narrow screens. */
export const ChartPeriodToggle = ({ options, value, onChange, activeClass }) => (
  <div className="w-full sm:w-auto overflow-x-auto -mx-1 px-1 pb-0.5">
    <div className="inline-flex min-w-max bg-[#f2eee2] p-1 rounded-xl sm:rounded-2xl border border-[#e6dcc4] shadow-inner">
      {options.map((type) => {
        const isActive = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`relative px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black transition-all duration-350 uppercase tracking-widest whitespace-nowrap overflow-hidden ${
              isActive
                ? activeClass
                : "text-lux-muted hover:text-lux-emerald hover:bg-white/60"
            } ${isActive ? "active:scale-[0.97]" : "active:scale-[0.98]"}`}
          >
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-lux-gold/70" />
            )}
            {type}
          </button>
        );
      })}
    </div>
  </div>
);

/**
 * Chart empty state — shows a friendly placeholder with icon and
 * a staggered fade-in animation.
 */
export const ChartEmptyState = ({
  title = "No data for this period",
  subtitle = "Adjust filters or try a different time range.",
  Icon = FaChartLine,
}) => (
  <div className="h-full flex flex-col items-center justify-center text-lux-muted gap-4 p-4 animate-scale-in">
    <div className="relative">
      <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#f2eee2] to-lux-cream animate-pulseSlow" />
      <div className="relative w-16 h-16 bg-lux-cream rounded-2xl flex items-center justify-center border border-[#e9e2d3] shadow-sm animate-float">
        <Icon className="w-7 h-7 text-lux-gold/70" />
      </div>
    </div>
    <div className="text-center max-w-[240px] space-y-1">
      <p className="font-serif text-sm font-semibold text-lux-ink">{title}</p>
      <p className="text-[10px] font-bold text-lux-muted">{subtitle}</p>
    </div>
  </div>
);

/**
 * useChartDataFetch — combines caching (respects the apiClient TTL),
 * a "first-load" skeleton, a spinner during subsequent refreshes,
 * and debounced view-type transitions.
 *
 * Usage:
 *   const { data, rawData, loading, firstLoad, refetch } = useChartDataFetch(apiUrl, externalData);
 */
export const useChartDataFetch = (apiUrl, externalData, api = null) => {
  const [internalRaw, setInternalRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(!externalData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalData) {
      setFirstLoad(false);
      return undefined;
    }
    if (!apiUrl || !api) return undefined;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(apiUrl);
        if (!cancelled) {
          const data = response.data?.data || response.data || [];
          setInternalRaw(data);
          setFirstLoad(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`Chart fetch failed (${apiUrl}):`, err);
          setError(err);
          setFirstLoad(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, api, externalData]);

  const refetch = async (force = false) => {
    if (!apiUrl || !api) return;
    setLoading(true);
    try {
      if (force && typeof (api.clearApiCache || (api.defaults && api.defaults.adapter)) === "function" && api.clearApiCache) {
        try { api.clearApiCache(); } catch { /* ignore */ }
      }
      const response = await api.get(apiUrl);
      const data = response.data?.data || response.data || [];
      setInternalRaw(data);
      setError(null);
    } catch (err) {
      console.error(`Chart refetch failed (${apiUrl}):`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    rawData: externalData || internalRaw,
    loading,
    firstLoad: firstLoad && !externalData,
    error,
    refetch,
  };
};

/** Recharts XAxis props that reduce label clutter on small screens. */
export const RESPONSIVE_X_AXIS_PROPS = {
  minTickGap: 18,
  interval: "preserveStartEnd",
};
