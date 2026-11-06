import { useMemo } from "react";

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
  strokeDasharray: "4 12",
  vertical: false,
  stroke: "#e0d8c6",
  strokeOpacity: 0.7,
};

export const MODERN_BAR_CURSOR = {
  fill: "rgba(201, 162, 39, 0.10)",
  radius: 12,
};

export const MODERN_BAR_ANIMATION = {
  animationDuration: 1600,
  animationEasing: "ease-out",
  animationBegin: 60,
};

export const MODERN_AREA_ANIMATION = {
  animationDuration: 1900,
  animationEasing: "ease-out",
  animationBegin: 100,
};

export const MODERN_LINE_ANIMATION = {
  animationDuration: 2000,
  animationEasing: "ease-out",
  animationBegin: 140,
};

export const MODERN_PIE_ANIMATION = {
  animationDuration: 1500,
  animationEasing: "ease-out",
  animationBegin: 120,
};

export const MODERN_LINE_DOT = {
  r: 3.5,
  strokeWidth: 2,
  stroke: "#fffefb",
  fillOpacity: 1,
};

export const MODERN_ACTIVE_DOT = { r: 6, strokeWidth: 3, stroke: "#fffefb" };

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

export const BarGradientDefs = ({
  gradientId,
  shadowId,
  topColor,
  bottomColor,
  midColor,
  glossId,
}) => (
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={topColor} stopOpacity={1} />
      {midColor && <stop offset="52%" stopColor={midColor} stopOpacity={0.96} />}
      <stop offset="100%" stopColor={bottomColor} stopOpacity={1} />
    </linearGradient>
    {glossId && (
      <linearGradient id={glossId} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
        <stop offset="42%" stopColor="#ffffff" stopOpacity={0.06} />
        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
      </linearGradient>
    )}
    {shadowId && (
      <filter id={shadowId} x="-40%" y="-30%" width="180%" height="170%">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="7"
          floodColor={bottomColor}
          floodOpacity="0.28"
        />
      </filter>
    )}
  </defs>
);

export const MultiBarGradientDefs = ({ idPrefix, colors, shadowId, shadowColor }) => (
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
        <stop offset="0%" stopColor={lightenHexColor(color, 1.42)} stopOpacity={1} />
        <stop offset="45%" stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={darkenHexColor(color, 0.74)} stopOpacity={1} />
      </linearGradient>
    ))}
    {shadowId && (
      <filter id={shadowId} x="-40%" y="-30%" width="180%" height="170%">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="6"
          floodColor={shadowColor || colors[0] || "#065f46"}
          floodOpacity="0.26"
        />
      </filter>
    )}
  </defs>
);

export const PieGradientDefs = ({
  idPrefix = "pie3d",
  colors = PIE_3D_COLORS,
  withShadow = true,
}) => (
  <defs>
    {colors.map((color, index) => (
      <linearGradient
        key={`${idPrefix}-g-${index}`}
        id={`${idPrefix}-g-${index}`}
        x1="0"
        y1="0"
        x2="0.4"
        y2="1"
      >
        <stop offset="0%" stopColor={lightenHexColor(color, 1.45)} stopOpacity={1} />
        <stop offset="52%" stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={darkenHexColor(color, 0.7)} stopOpacity={1} />
      </linearGradient>
    ))}
    {withShadow && (
      <filter id={`${idPrefix}-shadow`} x="-35%" y="-25%" width="170%" height="170%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
        <feOffset in="blur" dx="0" dy="9" result="offset" />
        <feComponentTransfer in="offset" result="fade">
          <feFuncA type="linear" slope="0.34" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="fade" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    )}
  </defs>
);

export const ChartGlowDefs = ({ idPrefix = "chartGlow", color = "#065f46" }) => (
  <defs>
    <filter id={`${idPrefix}-glow`} x="-30%" y="-60%" width="160%" height="260%">
      <feDropShadow
        dx="0"
        dy="0"
        stdDeviation="4"
        floodColor={color}
        floodOpacity="0.45"
      />
    </filter>
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

  const depth = Math.min(9, width * 0.24, height * 0.22);
  const right = x + width;
  const bottom = y + height;
  const radius = Math.min(9, width / 2);

  return (
    <g>
      <path
        d={`M ${right} ${y + radius} L ${right + depth} ${y + radius - depth} L ${right + depth} ${bottom - depth} L ${right} ${bottom} Z`}
        fill={fill}
        opacity={0.5}
      />
      <path
        d={`M ${x} ${y} L ${x + depth} ${y - depth} L ${right + depth} ${y - depth} L ${right} ${y} Z`}
        fill={fill}
        opacity={0.92}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill={fill}
      />
      <rect
        x={x + 1}
        y={y + radius}
        width={Math.max(1.5, width * 0.16)}
        height={Math.max(0, height - radius - 3)}
        rx={1}
        fill="#ffffff"
        opacity={0.26}
      />
    </g>
  );
};

export const darkenHexColor = (color, factor = 0.62) => {
  const hex = String(color).replace("#", "");
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

export const lightenHexColor = (color, factor = 1.35) => {
  const hex = String(color).replace("#", "");
  if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(hex)) return color;
  const normalized = hex.length === 3
    ? hex.split("").map((digit) => digit + digit).join("")
    : hex;
  const channels = normalized.match(/.{2}/g);
  return `#${channels
    .map((channel) =>
      Math.min(255, Math.round(parseInt(channel, 16) * factor))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

export const pieDepthColor = (color, factor = 0.5) =>
  darkenHexColor(color, factor);

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

export const PIE_3D_COLORS = [
  "#065f46",
  "#0d7a68",
  "#12a594",
  "#c9a227",
  "#e6cf86",
  "#b8860b",
  "#04392c",
  "#0f8a6c",
];
