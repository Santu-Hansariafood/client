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
  LabelList,
} from "recharts";
import {
  MultiBarGradientDefs,
  MODERN_AXIS_TICK,
  MODERN_BAR_ANIMATION,
  MODERN_BAR_CURSOR,
  MODERN_CHART_MARGIN,
  MODERN_GRID_PROPS,
  MODERN_AREA_ANIMATION,
} from "../modernBarChartShared";
import {
  CHART_AREA_CLASS,
  ChartPanelHeader,
} from "../chartLayoutShared";

const COLORS = {
  total: "#6366f1",
  completed: "#10b981",
  pending: "#f59e0b",
  inProgress: "#8b5cf6",
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl p-5 shadow-2xl border border-slate-100 rounded-2xl min-w-[190px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-slate-600">{entry.name}:</span>
              </span>
              <span style={{ color: entry.color }}>
                {entry.value}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EmployeeWorkChart = ({ dateWiseData = [], employeeWiseData = [], chartType = "area" }) => {
  const [viewType, setViewType] = useState("date"); // 'date' or 'employee'

  const chartData = useMemo(() => {
    if (viewType === "date") {
      return dateWiseData.map(item => ({
        date: new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        ...item,
      }));
    }
    return employeeWiseData.map(item => ({
      name: item.name,
      total: item.total,
      completed: item.completed,
      pending: item.pending,
    }));
  }, [dateWiseData, employeeWiseData, viewType]);

  const renderChart = () => {
    if (viewType === "employee" && chartType === "pie") {
      const pieData = chartData.map(item => ({
        name: item.name,
        value: item.total,
      }));
      return (
        <PieChart>
          <defs>
            <filter id="employeePieShadow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
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
            cy="50%"
            innerRadius="48%"
            outerRadius="78%"
            paddingAngle={10}
            dataKey="value"
            animationDuration={2500}
            animationEasing="ease-out"
            stroke="none"
            filter="url(#employeePieShadow)"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={10}
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
      margin: MODERN_CHART_MARGIN,
    };

    if (chartType === "bar") {
      const colors = Object.values(COLORS);
      return (
        <BarChart
          {...commonProps}
          barCategoryGap="22%"
          maxBarSize={48}
        >
          <MultiBarGradientDefs idPrefix="workBar" colors={colors} />
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
          <Tooltip
            content={<CustomTooltip />}
            cursor={MODERN_BAR_CURSOR}
          />
          <Bar
            dataKey="total"
            name="Total"
            radius={[12, 12, 4, 4]}
            {...MODERN_BAR_ANIMATION}
            stackId="a"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`work-bar-total-${index}`}
                fill={`url(#workBar-0)`}
              />
            ))}
          </Bar>
          <Bar
            dataKey="completed"
            name="Completed"
            radius={[12, 12, 4, 4]}
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
            <stop offset="5%" stopColor={COLORS.inProgress} stopOpacity={0.45} />
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
        <CartesianGrid
          strokeDasharray="8 12"
          vertical={false}
          stroke="#e2e8f0"
          strokeOpacity={0.6}
        />
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
          {...MODERN_AREA_ANIMATION}
        />
        <Legend
          verticalAlign="top"
          align="center"
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
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
          accentClass="bg-indigo-600"
          title="Employee Work Analytics"
          subtitle={viewType === "date" ? "Date-wise work distribution" : "Employee-wise work distribution"}
        />
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setViewType("date")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewType === "date"
                ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Date-wise
          </button>
          <button
            onClick={() => setViewType("employee")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewType === "employee"
                ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Employee-wise
          </button>
        </div>
      </div>

      <div className={CHART_AREA_CLASS}>
        {!chartData.length ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
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
            <p className="text-xs font-bold uppercase tracking-widest">
              No work data available
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

export default EmployeeWorkChart;
