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
  ChartSpinner,
  RESPONSIVE_X_AXIS_PROPS,
} from "../chartLayoutShared";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[180px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm font-black text-slate-800 flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-slate-600">{entry.name}:</span>
              </span>
              <span style={{ color: entry.color }}>
                Rs. {entry.value.toLocaleString("en-IN")}
              </span>
            </p>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-900 flex items-center justify-between">
              <span>Total:</span>
              <span>
                Rs.{" "}
                {(payload[0].value + payload[1].value).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const PaymentAnalyticsChart = ({ chartType = "line" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      options.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("default", { month: "long", year: "numeric" }),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return options;
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        clearApiCache();
        const response = await api.get("/payments/analytics", {
          params: {
            month: selectedMonth + 1, // backend expects 1-12
            year: selectedYear,
          },
        });
        const processedData = response.data.map((item) => ({
          date: new Date(item._id).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
          pending: item.pending,
          received: item.received,
          rawDate: item._id,
        }));
        setData(processedData);
      } catch (error) {
        console.error("Failed to fetch payment analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split("-").map(Number);
    setSelectedYear(year);
    setSelectedMonth(month - 1);
  };

  const currentMonthLabel = useMemo(() => {
    const option = monthOptions.find(
      (opt) => opt.month === selectedMonth && opt.year === selectedYear,
    );
    return option ? option.label : "";
  }, [selectedMonth, selectedYear, monthOptions]);

  if (loading)
    return (
      <div className={CHART_LOADING_CLASS}>
        <ChartSpinner colorClass="border-emerald-600" />
      </div>
    );

  if (!data.length)
    return (
      <div
        className={`${CHART_AREA_CLASS} flex flex-col items-center justify-center text-slate-400 px-4 text-center`}
      >
        <p className="font-bold uppercase tracking-widest text-xs">
          No payment data for {currentMonthLabel}
        </p>
      </div>
    );

  const legend = (
    <div className="flex flex-wrap gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 shadow-sm" />
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Pending
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shadow-sm" />
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Received
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <ChartPanelHeader
        accentClass="bg-emerald-600"
        title="Payment"
        highlight={{ text: "Settlement", className: "text-emerald-600" }}
        subtitle={`Pending vs received • ${currentMonthLabel}`}
      >
        {/* Month selector integrated into header */}
        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="sr-only">
            Select month
          </label>
          <select
            id="month-select"
            value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`}
            onChange={handleMonthChange}
            className="
              appearance-none
              bg-white/70 backdrop-blur-sm
              border border-slate-200
              rounded-xl
              px-4 py-2
              text-xs sm:text-sm
              font-semibold
              text-slate-700
              cursor-pointer
              shadow-sm
              hover:bg-white
              transition-all
              focus:outline-none
              focus:ring-2 focus:ring-emerald-500/50
              focus:border-transparent
              pr-8
              relative
            "
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "0.75rem",
            }}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {legend}
        </div>
      </ChartPanelHeader>

      <div className={CHART_AREA_CLASS}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={data}
              margin={MODERN_CHART_MARGIN}
              barCategoryGap="22%"
              barGap={6}
              maxBarSize={36}
            >
              <BarGradientDefs
                gradientId={BAR_SERIES_THEMES.pending.gradientId}
                topColor={BAR_SERIES_THEMES.pending.top}
                midColor={BAR_SERIES_THEMES.pending.mid}
                bottomColor={BAR_SERIES_THEMES.pending.bottom}
              />
              <BarGradientDefs
                gradientId={BAR_SERIES_THEMES.received.gradientId}
                topColor={BAR_SERIES_THEMES.received.top}
                midColor={BAR_SERIES_THEMES.received.mid}
                bottomColor={BAR_SERIES_THEMES.received.bottom}
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
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                width={44}
                domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
              />
              <Tooltip content={<CustomTooltip />} cursor={MODERN_BAR_CURSOR} />
              <Bar
                dataKey="pending"
                name="Pending"
                fill={`url(#${BAR_SERIES_THEMES.pending.gradientId})`}
                radius={[8, 8, 0, 0]}
                {...MODERN_BAR_ANIMATION}
                activeBar={modernActiveBar(
                  `url(#${BAR_SERIES_THEMES.pending.gradientId})`,
                )}
              />
              <Bar
                dataKey="received"
                name="Received"
                fill={`url(#${BAR_SERIES_THEMES.received.gradientId})`}
                radius={[8, 8, 0, 0]}
                {...MODERN_BAR_ANIMATION}
                activeBar={modernActiveBar(
                  `url(#${BAR_SERIES_THEMES.received.gradientId})`,
                )}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
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
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="pending"
                name="Pending"
                stroke="#fbbf24"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorPending)"
                animationDuration={2000}
              />
              <Area
                type="monotone"
                dataKey="received"
                name="Received"
                stroke="#10b981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorReceived)"
                animationDuration={2000}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PaymentAnalyticsChart;
