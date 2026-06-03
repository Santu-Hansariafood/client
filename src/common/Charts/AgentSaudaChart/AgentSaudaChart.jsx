import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import {
  BarGradientDefs,
  MultiBarGradientDefs,
  MODERN_AXIS_TICK,
  MODERN_BAR_ANIMATION,
  MODERN_BAR_CURSOR,
  MODERN_CHART_MARGIN,
  MODERN_GRID_PROPS,
} from "../modernBarChartShared";
import {
  CHART_AREA_CLASS,
  ChartPanelHeader,
} from "../chartLayoutShared";

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isPie = !label;
    const data = isPie ? payload[0].payload : null;
    return (
      <div className="bg-white/95 backdrop-blur-xl p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[150px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {isPie ? data.name : label}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{
                  backgroundColor: isPie ? payload[0].payload.fill : "#6366f1",
                }}
              ></span>
              <span className="text-slate-600">Volume:</span>
            </span>
            <span className="text-indigo-600">
              {payload[0].value.toLocaleString()} T
            </span>
          </p>
          {isPie && (
            <div className="pt-2 mt-2 border-t border-slate-50">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>Performance:</span>
                <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {((data.value / data.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const AgentSaudaChart = ({ data, chartType = "bar" }) => {
  const { chartData, totalTons } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.tons, 0);
    return {
      chartData: data.map((item) => ({
        name: item.name,
        value: item.tons,
        tons: item.tons,
        total,
      })),
      totalTons: total,
    };
  }, [data]);

  const renderChart = () => {
    if (chartType === "pie") {
      return (
        <PieChart>
          <defs>
            <filter id="pieShadow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset in="blur" dx="0" dy="5" result="offsetBlur" />
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={5}
            dataKey="value"
            animationDuration={2000}
            stroke="none"
            filter="url(#pieShadow)"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            formatter={(value) => (
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {value}
              </span>
            )}
            wrapperStyle={{ paddingTop: "20px" }}
          />
        </PieChart>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { ...MODERN_CHART_MARGIN, left: -12, bottom: 24 },
    };

    if (chartType === "bar") {
      const barColors = chartData.map(
        (_, index) => COLORS[index % COLORS.length],
      );

      return (
        <BarChart
          {...commonProps}
          barCategoryGap="28%"
          maxBarSize={44}
        >
          <MultiBarGradientDefs idPrefix="agentBar" colors={barColors} />
          <CartesianGrid {...MODERN_GRID_PROPS} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            angle={chartData.length > 4 ? -35 : -22}
            textAnchor="end"
            interval={0}
            height={chartData.length > 4 ? 72 : 56}
            tick={{
              ...MODERN_AXIS_TICK,
              fontSize: chartData.length > 6 ? 9 : 11,
            }}
            dy={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={MODERN_AXIS_TICK}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
            }
            width={40}
            domain={[0, (dataMax) => Math.ceil(dataMax * 1.12)]}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={MODERN_BAR_CURSOR}
          />
          <Bar
            dataKey="tons"
            radius={[10, 10, 0, 0]}
            {...MODERN_BAR_ANIMATION}
            activeBar={{
              stroke: "rgba(255,255,255,0.95)",
              strokeWidth: 2,
              radius: [12, 12, 0, 0],
            }}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`agent-bar-${index}`}
                fill={`url(#agentBar-${index})`}
              />
            ))}
            {chartData.length <= 8 && (
              <LabelList
                dataKey="tons"
                position="top"
                offset={8}
                formatter={(v) => (v > 0 ? `${v.toLocaleString()} T` : "")}
                style={{
                  fill: "#475569",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              />
            )}
          </Bar>
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorAgent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <filter id="agentAreaShadow" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="10" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f1f5f9"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
          angle={-25}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="tons"
          stroke="#4338ca"
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorAgent)"
          animationDuration={2000}
          filter="url(#agentAreaShadow)"
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full min-w-0">
      <ChartPanelHeader
        accentClass="bg-indigo-600"
        title="Agent Distribution"
        subtitle="Volume metrics by representative"
      />

      <div className={CHART_AREA_CLASS}>
        {!chartData.length ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">
              No agent data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AgentSaudaChart;
