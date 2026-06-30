/** Shared styling primitives for dashboard bar charts (Recharts). */

export const MODERN_CHART_MARGIN = { top: 20, right: 20, left: 0, bottom: 10 };

export const MODERN_AXIS_TICK = {
  fill: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

export const MODERN_GRID_PROPS = {
  strokeDasharray: "8 12",
  vertical: false,
  stroke: "#e2e8f0",
  strokeOpacity: 0.6,
};

export const MODERN_BAR_CURSOR = {
  fill: "rgba(99, 102, 241, 0.08)",
  radius: 12,
};

export const MODERN_BAR_ANIMATION = {
  animationDuration: 2500,
  animationEasing: "ease-out",
  animationBegin: 0,
};

export const MODERN_AREA_ANIMATION = {
  animationDuration: 2500,
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
      <filter id={shadowId} x="-30%" y="-20%" width="160%" height="150%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="6"
          floodColor={bottomColor}
          floodOpacity="0.2"
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
  stroke: "rgba(255,255,255,0.95)",
  strokeWidth: 3,
  radius: [14, 14, 4, 4],
  filter: "brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
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
    bottom: "#d97706",
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
  purple: {
    gradientId: "modernBarPurple",
    top: "#a78bfa",
    mid: "#8b5cf6",
    bottom: "#7c3aed",
  },
  red: {
    gradientId: "modernBarRed",
    top: "#fca5a5",
    mid: "#ef4444",
    bottom: "#dc2626",
  },
};
