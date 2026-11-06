import { useMemo, useState } from "react";
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
  Label,
} from "recharts";
import {
  MultiBarGradientDefs,
  PieGradientDefs,
  MODERN_ACTIVE_DOT,
  MODERN_AXIS_TICK,
  MODERN_BAR_ANIMATION,
  MODERN_BAR_CURSOR,
  MODERN_CHART_MARGIN,
  MODERN_GRID_PROPS,
  MODERN_AREA_ANIMATION,
  MODERN_PIE_ANIMATION,
  ExtrudedBarShape,
  pieDepthColor,
} from "../modernBarChartShared";
import {
  CHART_STAGE_CLASS,
  CHART_STAGE_INNER_CLASS,
  ChartPanelHeader,
  PieCenterLabel,
} from "../chartLayoutShared";

const COLORS = {
  total: "#04392c",
  completed: "#065f46",
  pending: "#c9a227",
  inProgress: "#12a594",
};

const PIE_COLORS = [
  "#065f46",
  "#0d7a68",
  "#12a594",
  "#c9a227",
  "#e6cf86",
  "#b8860b",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-lux-cream/95 backdrop-blur-xl p-5 shadow-2xl border border-[#e9e2d3] rounded-2xl min-w-[190px]">
        {label && (
          <p className="text-[10px] font-black text-lux-gold uppercase tracking-widest mb-3 border-b border-[#ece4d2] pb-2">
            {label}
          </p>
        )}
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm font-black text-lux-ink flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-lux-muted">{entry.name}:</span>
              </span>
              <span className="font-serif text-base font-semibold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EmployeeWorkChart = ({
  dateWiseData = [],
  employeeWiseData = [],
  chartType = "area",
  timeRange = "last_7_days",
}) => {
  const [viewType, setViewType] = useState("date");

  const chartData = useMemo(() => {
    let rawData = viewType === "date" ? dateWiseData : employeeWiseData;

    if (viewType === "date" && rawData.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      rawData = rawData.filter((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);

        if (timeRange === "today") {
          return itemDate.getTime() === now.getTime();
        } else if (timeRange === "last_7_days") {
          const pastDate = new Date(now);
          pastDate.setDate(now.getDate() - 7);
          return itemDate >= pastDate && itemDate <= now;
        } else if (timeRange === "last_30_days") {
          const pastDate = new Date(now);
          pastDate.setDate(now.getDate() - 30);
          return itemDate >= pastDate && itemDate <= now;
        } else if (timeRange === "this_month") {
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    if (viewType === "date") {
      return rawData.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        ...item,
      }));
    }

    return rawData.map((item) => ({
      name: item.name,
      total: item.total,
      completed: item.completed,
      pending: item.pending,
      inProgress: item.inProgress || 0,
    }));
  }, [dateWiseData, employeeWiseData, viewType, timeRange]);

  const renderChart = () => {
    if (viewType === "employee" && chartType === "pie") {
      const pieData = chartData.map((item) => ({
        name: item.name,
        value: item.total,
      }));
      const pieTotal = pieData.reduce((sum, item) => sum + (item.value || 0), 0);
      return (
        <PieChart className="animate-fade-in">
          <PieGradientDefs idPrefix="employeePie" colors={PIE_COLORS} />
          <Pie
            data={pieData}
            cx="50%"
            cy="48%"
            innerRadius="54%"
            outerRadius="80%"
            paddingAngle={4}
            dataKey="value"
            isAnimationActive={false}
            stroke="none"
          >
            {pieData.map((_, index) => (
              <Cell
                key={`employee-pie-depth-${index}`}
                fill={pieDepthColor(PIE_COLORS[index % PIE_COLORS.length])}
                stroke="none"
              />
            ))}
          </Pie>
          <Pie
            data={pieData}
            cx="50%"
            cy="44%"
            innerRadius="54%"
            outerRadius="80%"
            paddingAngle={4}
            dataKey="value"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth={1.5}
            filter="url(#employeePie-shadow)"
            {...MODERN_PIE_ANIMATION}
          >
            {pieData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#employeePie-g-${index % PIE_COLORS.length})`}
              />
            ))}
            <Label
              position="center"
              content={
                <PieCenterLabel
                  value={pieTotal.toLocaleString("en-IN")}
                  caption="Works"
                />
              }
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span className="text-[10px] font-serif font-semibold text-lux-muted">
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
      margin: MODERN_CHART_MARGIN,
    };

    if (chartType === "bar") {
      const colors = Object.values(COLORS);
      return (
        <BarChart {...commonProps} barCategoryGap="22%" maxBarSize={48}>
          <MultiBarGradientDefs
            idPrefix="workBar"
            colors={colors}
            shadowId="workBarShadow"
          />
          <CartesianGrid {...MODERN_GRID_PROPS} />
          <XAxis
            dataKey={viewType === "date" ? "date" : "name"}
            axisLine={false}
            tickLine={false}
            angle={chartData.length > 4 ? -30 : -20}
            textAnchor="end"
            interval={0}
            height={chartData.length > 4 ? 75 : 60}
            tick={{
              ...MODERN_AXIS_TICK,
              fontSize: chartData.length > 6 ? 10 : 11,
            }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={MODERN_AXIS_TICK}
            width={40}
            domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]}
          />
          <Tooltip content={<CustomTooltip />} cursor={MODERN_BAR_CURSOR} />
          <Bar
            dataKey="total"
            name="Total"
            shape={<ExtrudedBarShape />}
            filter="url(#workBarShadow)"
            {...MODERN_BAR_ANIMATION}
            stackId="a"
          >
            {chartData.map((_, index) => (
              <Cell key={`work-bar-total-${index}`} fill={`url(#workBar-0)`} />
            ))}
          </Bar>
          <Bar
            dataKey="completed"
            name="Completed"
            shape={<ExtrudedBarShape />}
            {...MODERN_BAR_ANIMATION}
            stackId="a"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`work-bar-completed-${index}`}
                fill={`url(#workBar-1)`}
              />
            ))}
          </Bar>
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.total} stopOpacity={0.45} />
            <stop offset="100%" stopColor={COLORS.total} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.completed} stopOpacity={0.45} />
            <stop offset="100%" stopColor={COLORS.completed} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.pending} stopOpacity={0.45} />
            <stop offset="100%" stopColor={COLORS.pending} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={COLORS.inProgress}
              stopOpacity={0.45}
            />
            <stop offset="100%" stopColor={COLORS.inProgress} stopOpacity={0} />
          </linearGradient>
          <filter id="workAreaShadow" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
            <feOffset dx="0" dy="8" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid {...MODERN_GRID_PROPS} />
        <XAxis
          dataKey={viewType === "date" ? "date" : "name"}
          axisLine={false}
          tickLine={false}
          tick={{ ...MODERN_AXIS_TICK, fontSize: 11 }}
          angle={-25}
          textAnchor="end"
          interval={0}
          height={65}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ ...MODERN_AXIS_TICK, fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="Total"
          stroke={COLORS.total}
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorTotal)"
          dot={false}
          activeDot={MODERN_ACTIVE_DOT}
          {...MODERN_AREA_ANIMATION}
          filter="url(#workAreaShadow)"
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke={COLORS.completed}
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorCompleted)"
          dot={false}
          activeDot={MODERN_ACTIVE_DOT}
          {...MODERN_AREA_ANIMATION}
        />
        <Area
          type="monotone"
          dataKey="pending"
          name="Pending"
          stroke={COLORS.pending}
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorPending)"
          dot={false}
          activeDot={MODERN_ACTIVE_DOT}
          {...MODERN_AREA_ANIMATION}
        />
        <Area
          type="monotone"
          dataKey="inProgress"
          name="In Progress"
          stroke={COLORS.inProgress}
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorInProgress)"
          dot={false}
          activeDot={MODERN_ACTIVE_DOT}
          {...MODERN_AREA_ANIMATION}
        />
        <Legend
          verticalAlign="top"
          align="center"
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span className="text-[10px] font-serif font-semibold text-lux-muted">
              {value}
            </span>
          )}
          wrapperStyle={{ paddingBottom: "15px" }}
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <ChartPanelHeader
          accentClass="bg-gradient-to-b from-lux-gold to-lux-emerald"
          title="Employee Work Analytics"
          subtitle={
            viewType === "date"
              ? "Date-wise work distribution"
              : "Employee-wise work distribution"
          }
        />
        <div className="flex gap-2 p-1.5 bg-[#f2eee2] border border-[#e6dcc4] rounded-2xl">
          <button
            onClick={() => setViewType("date")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewType === "date"
                ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-md ring-1 ring-lux-gold/30"
                : "text-lux-muted hover:text-lux-emerald"
            }`}
          >
            Date-wise
          </button>
          <button
            onClick={() => setViewType("employee")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewType === "employee"
                ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-md ring-1 ring-lux-gold/30"
                : "text-lux-muted hover:text-lux-emerald"
            }`}
          >
            Employee-wise
          </button>
        </div>
      </div>

      <div className={CHART_STAGE_CLASS}>
        {!chartData.length ? (
          <div className="h-full flex flex-col items-center justify-center text-lux-muted gap-4">
            <div className="w-20 h-20 bg-lux-cream rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                ></path>
              </svg>
            </div>
            <p className="font-serif text-sm font-semibold text-lux-ink">
              No work data available
            </p>
          </div>
        ) : (
          <div className={CHART_STAGE_INNER_CLASS}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeWorkChart;
