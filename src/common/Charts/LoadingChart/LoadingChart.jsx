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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-lux-cream/95 backdrop-blur-xl p-4 shadow-2xl border border-[#e9e2d3] rounded-2xl min-w-[150px]">
        <p className="text-[10px] font-black text-lux-gold uppercase tracking-widest mb-2 border-b border-[#ece4d2] pb-2">
          {label}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-lux-ink flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lux-emerald shadow-sm"></span>
              <span className="text-lux-muted">Weight:</span>
            </span>
            <span className="font-serif text-base font-semibold text-lux-emerald">
              {payload[0].value.toFixed(2)} T
            </span>
          </p>
          {payload[1] && (
            <div className="pt-2 mt-2 border-t border-[#ece4d2]">
              <p className="text-sm font-black text-lux-ink flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-lux-gold shadow-sm"></span>
                  <span className="text-lux-muted">Entries:</span>
                </span>
                <span className="font-serif text-base font-semibold text-lux-gold">{payload[1].value}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const LoadingChart = ({ apiUrl, chartType = "line", data: externalData }) => {
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
          console.error("Failed to fetch loading chart data", error);
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
          const date = new Date(item.loadingDate || item.createdAt);
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
              stats[key] = { weight: 0, count: 0, sortKey };
            }
            stats[key].weight += Number(item.loadingWeight) || 0;
            stats[key].count += 1;
          }
        });

        const chartData = Object.entries(stats)
          .map(([date, stat]) => ({
            date,
            weight: stat.weight,
            count: stat.count,
            sortKey: stat.sortKey,
          }))
          .sort((a, b) => a.sortKey - b.sortKey);

        setInternalData(chartData);
      };
      processData();
    }
  }, [rawData, viewType]);

  const data = useMemo(
    () => externalData || internalData,
    [externalData, internalData],
  );

  if (loading)
    return (
      <div className={CHART_LOADING_CLASS}>
        <ChartSpinner colorClass="border-lux-emerald" />
      </div>
    );

  const renderChart = () => {
    const theme = BAR_SERIES_THEMES.blue;
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
            shadowId="loadingBarShadow"
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
            dataKey="weight"
            fill={`url(#${theme.gradientId})`}
            radius={[10, 10, 0, 0]}
            filter="url(#loadingBarShadow)"
            {...MODERN_BAR_ANIMATION}
            activeBar={modernActiveBar(`url(#${theme.gradientId})`)}
          />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d7a68" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#0d7a68" stopOpacity={0} />
          </linearGradient>
          <filter id="areaShadow" height="200%">
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#0d7a68"
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorWeight)"
          animationDuration={2000}
          filter="url(#areaShadow)"
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full min-w-0">
      <ChartPanelHeader
        accentClass="bg-gradient-to-b from-lux-gold to-lux-emerald"
        title="Loading Analytics"
        subtitle={`Performance by ${viewType}`}
      >
        <ChartPeriodToggle
          options={["weekly", "monthly", "quarterly", "yearly"]}
          value={viewType}
          onChange={setViewType}
          activeClass="bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-md ring-1 ring-lux-gold/30"
        />
      </ChartPanelHeader>

      <div className={CHART_AREA_CLASS}>
        {!data.length ? (
          <div className="h-full flex flex-col items-center justify-center text-lux-muted gap-4">
            <div className="w-16 h-16 bg-lux-cream rounded-full flex items-center justify-center">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
              </svg>
            </div>
            <p className="font-serif text-sm font-semibold text-lux-ink">
              No loading data for this period
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

export default LoadingChart;
