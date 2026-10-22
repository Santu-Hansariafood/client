import { useMemo } from "react";

/** Shared styling primitives for dashboard bar charts (Recharts). */

export const MODERN_CHART_MARGIN = { top: 18, right: 16, left: 0, bottom: 10 };
export const MODERN_CHART_MARGIN_MOBILE = { top: 14, right: 10, left: -6, bottom: 6 };

export const MODERN_AXIS_TICK = {
  fill: "#5f6f68",
  fontSize: 11,
  fontWeight: 700,
};
export const MODERN_AXIS_TICK_MOBILE = {
  fill: "#8a968f",
  fontSize: 10,
  fontWeight: 700,
};

export const MODERN_GRID_PROPS = {
  strokeDasharray: "6 10",
  vertical: false,
  stroke: "#e0d8c6",
  strokeOpacity: 0.7,
};

export const MODERN_BAR_CURSOR = {
  fill: "rgba(201, 162, 39, 0.10)",
  radius: 12,
};

export const MODERN_BAR_ANIMATION = {
  animationDuration: 1800,
  animationEasing: "ease-out",
  animationBegin: 80,
};

export const MODERN_AREA_ANIMATION = {
  animationDuration: 2000,
  animationEasing: "ease-out",
  animationBegin: 120,
};

/**
 * Returns responsive chart margins and bar sizing depending on screen width.
 * Keeps charts looking balanced on phones and desktop alike.
 */
export const useResponsiveChartConfig = (viewType = "monthly") => {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        margin: MODERN_CHART_MARGIN,
        tick: MODERN_AXIS_TICK,
        maxBarSize: 32,
        barCategoryGap: "24%",
        areaStrokeWidth: 4,
        showFullLegend: true,
      };
    }
    const w = window.innerWidth;
    if (w < 640) {
      return {
        margin: MODERN_CHART_MARGIN_MOBILE,
        tick: MODERN_AXIS_TICK_MOBILE,
        maxBarSize: viewType === "weekly" ? 36 : 22,
        barCategoryGap: "18%",
        areaStrokeWidth: 3,
        showFullLegend: false,
      };
    }
    if (w < 1024) {
      return {
        margin: { ...MODERN_CHART_MARGIN, right: 12 },
        tick: MODERN_AXIS_TICK,
        maxBarSize: viewType === "weekly" ? 44 : 26,
        barCategoryGap: "22%",
        areaStrokeWidth: 4,
        showFullLegend: true,
      };
    }
    return {
      margin: MODERN_CHART_MARGIN,
      tick: MODERN_AXIS_TICK,
      maxBarSize: viewType === "weekly" ? 52 : 32,
      barCategoryGap: "24%",
      areaStrokeWidth: 5,
      showFullLegend: true,
    };
  }, [viewType]);
};

/**
 * SVG defs: vertical gradient + soft drop shadow for a bar series.
 */
export const BarGradientDefs = ({
  gradientId,
  shadowId,
  topColor,
  bottomColor,
  midColor,
}) => (
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={topColor} stopOpacity={1} />
      {midColor && (
        <stop offset="50%" stopColor={midColor} stopOpacity={0.95} />
      )}
      <stop offset="100%" stopColor={bottomColor} stopOpacity={1} />
    </linearGradient>
    {shadowId && (
      <filter id={shadowId} x="-30%" y="-20%" width="160%" height="150%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="6"
          floodColor={bottomColor}
          floodOpacity="0.22"
        />
      </filter>
    )}
  </defs>
);

/**
 * Per-index gradients for multi-color bar charts (e.g., agent breakdown).
 */
export const MultiBarGradientDefs = ({ idPrefix, colors }) => (
  <defs>
    {colors.map((color, index) => (
      <linearGradient
        key={`${idPrefix}-${index}`}
        id={`${idPrefix}-${index}`}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="0%" stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={color} stopOpacity={0.65} />
      </linearGradient>
    ))}
  </defs>
);

export const modernActiveBar = (fillUrl) => ({
  fill: fillUrl,
  stroke: "rgba(255, 254, 251, 0.95)",
  strokeWidth: 3,
  radius: [14, 14, 4, 4],
  filter: "brightness(1.12) drop-shadow(0 4px 8px rgba(0,0,0,0.12))",
});

export const ExtrudedBarShape = ({ x, y, width, height, fill }) => {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null;
  }

  const depth = Math.min(7, width * 0.18, height * 0.18);
  const right = x + width;
  const bottom = y + height;

  return (
    <g>
      <path
        d={`M ${right} ${y} L ${right + depth} ${y - depth} L ${right + depth} ${bottom - depth} L ${right} ${bottom} Z`}
        fill={fill}
        opacity={0.58}
      />
      <path
        d={`M ${x} ${y} L ${x + depth} ${y - depth} L ${right + depth} ${y - depth} L ${right} ${y} Z`}
        fill={fill}
        opacity={0.82}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={Math.min(8, width / 2)}
        fill={fill}
      />
    </g>
  );
};

export const darkenHexColor = (color, factor = 0.62) => {
  const hex = color.replace("#", "");
  if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(hex)) return color;
  const normalized = hex.length === 3
    ? hex.split("").map((digit) => digit + digit).join("")
    : hex;
  const channels = normalized.match(/.{2}/g);
  return `#${channels
    .map((channel) =>
      Math.round(parseInt(channel, 16) * factor)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

/** Luxury series themes — deep emerald, gold and teal tones. */
export const BAR_SERIES_THEMES = {
  emerald: {
    gradientId: "modernBarEmerald",
    top: "#0f8a6c",
    mid: "#065f46",
    bottom: "#04392c",
  },
  green: {
    gradientId: "modernBarAmber",
    top: "#e6cf86",
    mid: "#c9a227",
    bottom: "#b8860b",
  },
  blue: {
    gradientId: "modernBarBlue",
    top: "#12a594",
    mid: "#0d7a68",
    bottom: "#065f46",
  },
  indigo: {
    gradientId: "modernBarIndigo",
    top: "#0f8a6c",
    mid: "#065f46",
    bottom: "#04392c",
  },
  pending: {
    gradientId: "modernBarPending",
    top: "#e6cf86",
    mid: "#c9a227",
    bottom: "#b8860b",
  },
  received: {
    gradientId: "modernBarReceived",
    top: "#0f8a6c",
    mid: "#065f46",
    bottom: "#04392c",
  },
  purple: {
    gradientId: "modernBarPurple",
    top: "#12a594",
    mid: "#0d7a68",
    bottom: "#065f46",
  },
  red: {
    gradientId: "modernBarRed",
    top: "#e6cf86",
    mid: "#c9a227",
    bottom: "#b8860b",
  },
  cyan: {
    gradientId: "modernBarCyan",
    top: "#12a594",
    mid: "#0d7a68",
    bottom: "#065f46",
  },
};
