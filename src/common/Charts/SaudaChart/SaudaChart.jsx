import { useState, useEffect, useMemo } from "react";
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
} from "recharts";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import {
  BarGradientDefs,
  BAR_SERIES_THEMES,
  MODERN_AXIS_TICK,
  MODERN_BAR_ANIMATION,
  MODERN_BAR_CURSOR,
  MODERN_CHART_MARGIN,
  MODERN_GRID_PROPS,
  modernActiveBar,
} from "../modernBarChartShared";
import {
  CHART_AREA_CLASS,
  CHART_LOADING_CLASS,
  ChartPanelHeader,
  ChartPeriodToggle,
  ChartSpinner,
  RESPONSIVE_X_AXIS_PROPS,
} from "../chartLayoutShared";

const COLORS = [
  "#10b981",
  "#3b82f6",
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
                  backgroundColor: isPie ? payload[0].payload.fill : "#10b981",
                }}
              ></span>
              <span className="text-slate-600">Total:</span>
            </span>
            <span className="text-emerald-600">{payload[0].value} Saudas</span>
          </p>
          {isPie && (
            <div className="pt-2 mt-2 border-t border-slate-50">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>Market Share:</span>
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

const SaudaChart = ({ apiUrl, chartType = "line", data: externalData }) => {
  const [internalData, setInternalData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("monthly");

  useEffect(() => {
    if (apiUrl && !externalData) {
      const fetchData = async () => {
        setLoading(true);
        try {
          clearApiCache();
          const response = await api.get(apiUrl);
          const data = response.data?.data || response.data || [];
          setRawData(data);
        } catch (error) {
          console.error("Failed to fetch sauda chart data", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [apiUrl, externalData]);

  useEffect(() => {
    if (rawData.length > 0) {
      const processData = () => {
        const stats = {};
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        rawData.forEach((item) => {
          const date = new Date(item.createdAt || item.date);
          let key;
          let sortKey;

          if (viewType === "weekly") {
            const diff = today - date;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
              key = date.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              sortKey = date.getTime();
            }
          } else if (viewType === "monthly") {
            const diff = today - date;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 30) {
              key = date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              });
              sortKey = date.getTime();
            }
          } else if (viewType === "quarterly") {
            const diff = today - date;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 90) {
              const weekNum = Math.ceil(date.getDate() / 7);
              key = `W${weekNum} ${date.toLocaleDateString("en-IN", { month: "short" })}`;
              sortKey = date.getTime();
            }
          } else if (viewType === "yearly") {
            key = date.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            });
            sortKey = new Date(
              date.getFullYear(),
              date.getMonth(),
              1,
            ).getTime();
          }

          if (key) {
            if (!stats[key]) {
              stats[key] = { count: 0, sortKey };
            }
            stats[key].count += 1;
          }
        });

        const chartData = Object.entries(stats)
          .map(([date, stat]) => ({
            date,
            count: stat.count,
            sortKey: stat.sortKey,
          }))
          .sort((a, b) => a.sortKey - b.sortKey);

        setInternalData(chartData);
      };
      processData();
    }
  }, [rawData, viewType]);

  const pieData = useMemo(() => {
    if (!rawData.length) return [];
    const stats = {};
    let total = 0;
    rawData.forEach((item) => {
      const key = item.commodity || "Other";
      if (!stats[key]) stats[key] = 0;
      stats[key] += 1;
      total += 1;
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value, total }))
      .sort((a, b) => b.value - a.value);
  }, [rawData]);

  const data = useMemo(
    () => externalData || internalData,
    [externalData, internalData],
  );

  if (loading)
    return (
      <div className={CHART_LOADING_CLASS}>
        <ChartSpinner colorClass="border-emerald-600" />
      </div>
    );

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
            data={pieData}
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
            {pieData.map((entry, index) => (
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

    const theme = BAR_SERIES_THEMES.emerald;
    const commonProps = {
      data,
      margin: { ...MODERN_CHART_MARGIN, left: -12 },
    };

    if (chartType === "bar") {
      return (
        <BarChart
          {...commonProps}
          barCategoryGap="24%"
          maxBarSize={viewType === "weekly" ? 48 : 28}
        >
          <BarGradientDefs
            gradientId={theme.gradientId}
            shadowId="saudaBarShadow"
            topColor={theme.top}
            midColor={theme.mid}
            bottomColor={theme.bottom}
          />
          <CartesianGrid {...MODERN_GRID_PROPS} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={MODERN_AXIS_TICK}
            dy={10}
            {...RESPONSIVE_X_AXIS_PROPS}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={MODERN_AXIS_TICK}
            width={36}
            domain={[0, (dataMax) => Math.ceil(dataMax * 1.12) || 1]}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={MODERN_BAR_CURSOR}
          />
          <Bar
            dataKey="count"
            fill={`url(#${theme.gradientId})`}
            radius={[10, 10, 0, 0]}
            filter="url(#saudaBarShadow)"
            {...MODERN_BAR_ANIMATION}
            activeBar={modernActiveBar(`url(#${theme.gradientId})`)}
          />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorSauda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <filter id="saudaAreaShadow" height="200%">
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
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={MODERN_AXIS_TICK}
          dy={10}
          {...RESPONSIVE_X_AXIS_PROPS}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={MODERN_AXIS_TICK}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#059669"
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorSauda)"
          animationDuration={2000}
          filter="url(#saudaAreaShadow)"
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full min-w-0">
      <ChartPanelHeader
        accentClass="bg-emerald-600"
        title="Sauda Activity"
        subtitle={`Market momentum by ${viewType}`}
      >
        {chartType !== "pie" && (
          <ChartPeriodToggle
            options={["weekly", "monthly", "quarterly", "yearly"]}
            value={viewType}
            onChange={setViewType}
            activeClass="bg-white text-emerald-600 shadow-md ring-1 ring-emerald-100"
          />
        )}
      </ChartPanelHeader>

      <div className={CHART_AREA_CLASS}>
        {!data.length ? (
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                ></path>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">
              No sauda data for this period
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

export default SaudaChart;
