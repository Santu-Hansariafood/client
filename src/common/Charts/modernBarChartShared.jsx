/** Shared styling primitives for dashboard bar charts (Recharts). */

export const MODERN_CHART_MARGIN = { top: 14, right: 10, left: 0, bottom: 2 };

export const MODERN_AXIS_TICK = {
  fill: "#64748b",
  fontSize: 10,
  fontWeight: 700,
};

export const MODERN_GRID_PROPS = {
  strokeDasharray: "6 10",
  vertical: false,
  stroke: "#e2e8f0",
  strokeOpacity: 0.7,
};

export const MODERN_BAR_CURSOR = {
  fill: "rgba(99, 102, 241, 0.06)",
  radius: 8,
};

export const MODERN_BAR_ANIMATION = {
  animationDuration: 1200,
  animationEasing: "ease-out",
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
      <filter id={shadowId} x="-30%" y="-10%" width="160%" height="130%">
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="4"
          floodColor={bottomColor}
          floodOpacity="0.25"
        />
      </filter>
    )}
  </defs>
);

/**
 * Per-index gradients for multi-color bar charts (e.g. agent breakdown).
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
        <stop offset="100%" stopColor={color} stopOpacity={0.72} />
      </linearGradient>
    ))}
  </defs>
);

export const modernActiveBar = (fillUrl) => ({
  fill: fillUrl,
  stroke: "rgba(255,255,255,0.9)",
  strokeWidth: 2,
  radius: [10, 10, 0, 0],
  filter: "brightness(1.08)",
});

export const BAR_SERIES_THEMES = {
  emerald: {
    gradientId: "modernBarEmerald",
    top: "#34d399",
    mid: "#10b981",
    bottom: "#047857",
  },
  amber: {
    gradientId: "modernBarAmber",
    top: "#fcd34d",
    mid: "#f59e0b",
    bottom: "#b45309",
  },
  blue: {
    gradientId: "modernBarBlue",
    top: "#60a5fa",
    mid: "#3b82f6",
    bottom: "#1d4ed8",
  },
  indigo: {
    gradientId: "modernBarIndigo",
    top: "#818cf8",
    mid: "#6366f1",
    bottom: "#4338ca",
  },
  pending: {
    gradientId: "modernBarPending",
    top: "#fde68a",
    mid: "#fbbf24",
    bottom: "#d97706",
  },
  received: {
    gradientId: "modernBarReceived",
    top: "#6ee7b7",
    mid: "#10b981",
    bottom: "#047857",
  },
};
