import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { FaHandshake } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";

import {
  BarGradientDefs,
  BAR_SERIES_THEMES,
  MODERN_GRID_PROPS,
  MODERN_BAR_ANIMATION,
  MODERN_BAR_CURSOR,
  MODERN_AREA_ANIMATION,
  modernActiveBar,
  useResponsiveChartConfig,
} from "../modernBarChartShared";
import {
  CHART_AREA_CLASS,
  CHART_LOADING_CLASS,
  ChartPanelHeader,
  ChartPeriodToggle,
  ChartSpinner,
  ChartSkeleton,
  ChartEmptyState,
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
  "#14b8a6",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isPie = !label;
    const data = isPie ? payload[0].payload : null;
    return (
      <div className="relative bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[150px] animate-pop-in">
        <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-white border-t border-l border-slate-100" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {isPie ? data?.name : label}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{
                  backgroundColor: isPie ? payload[0].payload.fill : "#10b981",
                }}
              />
              <span className="text-slate-600">Total:</span>
            </span>
            <span className="text-emerald-700 tabular-nums">
              {payload[0].value}
              <span className="text-[10px] font-bold text-emerald-600/70 ml-1">
                Saudas
              </span>
            </span>
          </p>
          {isPie && data && (
            <div className="pt-2 mt-2 border-t border-slate-50">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>Market Share:</span>
                <span className="text-slate-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md tabular-nums font-black">
                  {data.total > 0
                    ? ((data.value / data.total) * 100).toFixed(1)
                    : 0}
                  %
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
  const [firstLoad, setFirstLoad] = useState(!externalData);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("monthly");
  const processingRef = useRef(null);
  const responsiveCfg = useResponsiveChartConfig(viewType);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(apiUrl);
      const data = response.data?.data || response.data || [];
      setRawData(data);
      setFirstLoad(false);
    } catch (err) {
      console.error("Failed to fetch sauda chart data", err);
      setError(err);
      setFirstLoad(false);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (externalData) {
      setFirstLoad(false);
      return undefined;
    }
    if (!apiUrl) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await api.get(apiUrl);
        if (!cancelled) {
          const data = response.data?.data || response.data || [];
          setRawData(data);
          setFirstLoad(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch sauda chart data", err);
          setError(err);
          setFirstLoad(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, externalData]);

  useEffect(() => {
    if (rawData.length === 0) return;

    if (processingRef.current) {
      clearTimeout(processingRef.current);
    }

    processingRef.current = setTimeout(() => {
      const stats = new Map();
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        const date = new Date(item.createdAt || item.date);
        if (Number.isNaN(date.getTime())) continue;

        let key;
        let sortKey;
        const diffDays = Math.floor(
          (today - date) / (1000 * 60 * 60 * 24),
        );

        if (viewType === "weekly") {
          if (diffDays >= 0 && diffDays < 7) {
            key = date.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            sortKey = date.getTime();
          }
        } else if (viewType === "monthly") {
          if (diffDays >= 0 && diffDays < 30) {
            key = date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            });
            sortKey = date.getTime();
          }
        } else if (viewType === "quarterly") {
          if (diffDays >= 0 && diffDays < 90) {
            const weekNum = Math.ceil(date.getDate() / 7);
            key = `W${weekNum} ${date.toLocaleDateString("en-IN", { month: "short" })}`;
            sortKey = date.getTime();
          }
        } else if (viewType === "yearly") {
          key = date.toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          });
          sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
        }

        if (key) {
          const existing = stats.get(key);
          if (existing) existing.count += 1;
          else stats.set(key, { count: 1, sortKey });
        }
      }

      const chartData = Array.from(stats.entries())
        .map(([date, stat]) => ({
          date,
          count: stat.count,
          sortKey: stat.sortKey,
        }))
        .sort((a, b) => a.sortKey - b.sortKey);

      setInternalData(chartData);
    }, 80);

    return () => {
      if (processingRef.current) clearTimeout(processingRef.current);
    };
  }, [rawData, viewType]);

  const pieData = useMemo(() => {
    if (!rawData.length) return [];
    const stats = new Map();
    let total = 0;
    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];
      const key = item.commodity || "Other";
      stats.set(key, (stats.get(key) || 0) + 1);
      total += 1;
    }
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value, total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [rawData]);

  const data = useMemo(
    () => (Array.isArray(externalData) ? externalData : internalData),
    [externalData, internalData],
  );

  if (firstLoad) {
    return <ChartSkeleton rows={chartType === "pie" ? 0 : 6} />;
  }

  if (loading && !firstLoad)
    return (
      <div className={CHART_LOADING_CLASS}>
        <ChartSpinner colorClass="border-emerald-500" subtitle="Refreshing sauda activity" />
      </div>
    );

  const renderChart = () => {
    if (chartType === "pie") {
      const radius = responsiveCfg.showFullLegend
        ? { inner: "54%", outer: "80%" }
        : { inner: "48%", outer: "72%" };
      return (
        <PieChart className="animate-fade-in">
          <defs>
            <filter id="saudaPieShadow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
              <feOffset in="blur" dx="0" dy="6" result="offsetBlur" />
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Pie
            data={pieData}
            cx="50%"
            cy="45%"
            innerRadius={radius.inner}
            outerRadius={radius.outer}
            paddingAngle={pieData.length > 6 ? 3 : 5}
            dataKey="value"
            animationDuration={1800}
            stroke="none"
            filter="url(#saudaPieShadow)"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={responsiveCfg.showFullLegend ? 9 : 7}
            formatter={(value) => (
              <span
                className={`font-black text-slate-600 uppercase tracking-widest ${
                  responsiveCfg.showFullLegend ? "text-[10px]" : "text-[9px]"
                }`}
              >
                {value}
              </span>
            )}
            wrapperStyle={{ paddingTop: responsiveCfg.showFullLegend ? "16px" : "8px" }}
          />
        </PieChart>
      );
    }

    const theme = BAR_SERIES_THEMES.emerald;
    const commonProps = {
      data,
      margin: { ...responsiveCfg.margin, left: -12 },
    };

    if (chartType === "bar") {
      return (
        <BarChart
          {...commonProps}
          barCategoryGap={responsiveCfg.barCategoryGap}
          maxBarSize={responsiveCfg.maxBarSize}
          className="animate-fade-in"
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
            tick={responsiveCfg.tick}
            dy={10}
            {...RESPONSIVE_X_AXIS_PROPS}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={responsiveCfg.tick}
            width={36}
            allowDecimals={false}
            domain={[0, (dataMax) => Math.ceil(dataMax * 1.15) || 1]}
          />
          <Tooltip content={<CustomTooltip />} cursor={MODERN_BAR_CURSOR} />
          <Bar
            dataKey="count"
            fill={`url(#${theme.gradientId})`}
            radius={[10, 10, 2, 2]}
            filter="url(#saudaBarShadow)"
            {...MODERN_BAR_ANIMATION}
            activeBar={modernActiveBar(`url(#${theme.gradientId})`)}
          />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps} className="animate-fade-in">
        <defs>
          <linearGradient id="colorSauda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
          <filter id="saudaAreaShadow" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
            <feOffset dx="0" dy="10" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.28" />
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
          tick={responsiveCfg.tick}
          dy={10}
          {...RESPONSIVE_X_AXIS_PROPS}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={responsiveCfg.tick}
          width={36}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#059669", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#059669"
          strokeWidth={responsiveCfg.areaStrokeWidth}
          fillOpacity={1}
          fill="url(#colorSauda)"
          {...MODERN_AREA_ANIMATION}
          filter="url(#saudaAreaShadow)"
        />
      </AreaChart>
    );
  };

  const hasData = chartType === "pie" ? pieData.length > 0 : data.length > 0;

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <ChartPanelHeader
        accentClass="bg-emerald-600"
        title="Sauda Activity"
        subtitle={`Market momentum by ${viewType}`}
        icon={FaHandshake}
      >
        {chartType !== "pie" && (
          <ChartPeriodToggle
            options={["weekly", "monthly", "quarterly", "yearly"]}
            value={viewType}
            onChange={setViewType}
            activeClass="bg-white text-emerald-700 shadow-md ring-1 ring-emerald-200"
          />
        )}
      </ChartPanelHeader>

      <div className={`${CHART_AREA_CLASS} rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-emerald-50/20 to-white border border-slate-100 shadow-sm overflow-hidden`}>
        {error ? (
          <ChartEmptyState
            title="Unable to load sauda activity"
            subtitle="Tap to try again"
          />
        ) : !hasData ? (
          <ChartEmptyState
            title="No sauda data for this period"
            subtitle="Switch to a wider time range or check back later."
            Icon={FaHandshake}
          />
        ) : (
          <div className="w-full h-full p-2 sm:p-3 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaudaChart;
