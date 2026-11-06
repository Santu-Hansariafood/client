import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarGradientDefs,
  BAR_SERIES_THEMES,
  MODERN_AXIS_TICK,
  MODERN_BAR_ANIMATION,
  MODERN_BAR_CURSOR,
  MODERN_CHART_MARGIN,
  MODERN_GRID_PROPS,
  MODERN_LINE_ANIMATION,
  MODERN_ACTIVE_DOT,
  RoundedBarShape,
} from "../modernBarChartShared";
import {
  CHART_STAGE_CLASS,
  CHART_STAGE_INNER_CLASS,
} from "../chartLayoutShared";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatCompactCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;

const DailyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="bg-lux-cream/95 backdrop-blur-xl p-3.5 shadow-2xl border border-[#e9e2d3] rounded-2xl min-w-[170px]">
      <p className="text-[10px] font-black text-lux-gold uppercase tracking-widest mb-2 border-b border-[#ece4d2] pb-2">
        {row.date
          ? new Date(`${row.date}T12:00:00`).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : label}
      </p>
      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-4 text-xs font-bold text-lux-ink">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lux-emerald shadow-sm" />
            <span className="text-lux-muted">Saudas:</span>
          </span>
          <span className="font-serif text-sm font-semibold text-lux-emerald tabular-nums">
            {Number(row.saudas || 0).toLocaleString("en-IN")}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4 text-xs font-bold text-lux-ink">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lux-gold shadow-sm" />
            <span className="text-lux-muted">Value:</span>
          </span>
          <span className="font-serif text-sm font-semibold text-lux-gold tabular-nums">
            {formatCurrency(row.value)}
          </span>
        </p>
      </div>
    </div>
  );
};

const AgentDailySaudaChart = ({ data = [] }) => {
  const [selectedAgent, setSelectedAgent] = useState("");

  const { agents, chartData } = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const availableAgents = [...new Set(safeData.map((item) => item.agent))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));
    const dailyTotals = new Map();

    safeData
      .filter((item) => !selectedAgent || item.agent === selectedAgent)
      .forEach((item) => {
        const current = dailyTotals.get(item.date) || {
          date: item.date,
          saudas: 0,
          value: 0,
        };
        current.saudas += Number(item.saudas) || 0;
        current.value += Number(item.value) || 0;
        dailyTotals.set(item.date, current);
      });

    return {
      agents: availableAgents,
      chartData: [...dailyTotals.values()]
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((item) => ({
          ...item,
          dateLabel: new Date(`${item.date}T12:00:00`).toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short" },
          ),
        })),
    };
  }, [data, selectedAgent]);

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-base font-semibold text-lux-ink">
        Agent-wise daily Sauda · count and value
      </h3>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-lux-muted">
          Daily Sauda count and total value · last 30 days
        </p>
        <select
          aria-label="Filter daily Sauda chart by agent"
          value={selectedAgent}
          onChange={(event) => setSelectedAgent(event.target.value)}
          className="min-h-9 rounded-lg border border-[#e6dcc4] bg-white px-2 text-xs text-lux-ink outline-none focus:border-lux-emerald"
        >
          <option value="">All agents</option>
          {agents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
      </div>
      {chartData.length ? (
        <div className={CHART_STAGE_CLASS}>
          <div className={CHART_STAGE_INNER_CLASS}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ ...MODERN_CHART_MARGIN, left: -6 }}
              >
                <BarGradientDefs
                  gradientId="agentDailyBar"
                  shadowId="agentDailyBarShadow"
                  topColor={BAR_SERIES_THEMES.emerald.top}
                  midColor={BAR_SERIES_THEMES.emerald.mid}
                  bottomColor={BAR_SERIES_THEMES.emerald.bottom}
                />
                <CartesianGrid {...MODERN_GRID_PROPS} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
                  tick={{ ...MODERN_AXIS_TICK, fontSize: 10 }}
                />
                <YAxis
                  yAxisId="saudas"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ ...MODERN_AXIS_TICK, fontSize: 10 }}
                  width={38}
                />
                <YAxis
                  yAxisId="value"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompactCurrency}
                  tick={{ ...MODERN_AXIS_TICK, fontSize: 10 }}
                  width={64}
                />
                <Tooltip
                  content={<DailyTooltip />}
                  cursor={MODERN_BAR_CURSOR}
                />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  wrapperStyle={{ paddingTop: "8px" }}
                  formatter={(value) => (
                    <span className="font-serif font-semibold text-lux-muted text-[10px]">
                      {value}
                    </span>
                  )}
                />
                <Bar
                  yAxisId="saudas"
                  dataKey="saudas"
                  name="Saudas"
                  fill="url(#agentDailyBar)"
                  shape={<RoundedBarShape />}
                  filter="url(#agentDailyBarShadow)"
                  {...MODERN_BAR_ANIMATION}
                />
                <Line
                  yAxisId="value"
                  dataKey="value"
                  name="Value"
                  type="monotone"
                  stroke="#c9a227"
                  strokeWidth={3}
                  dot={false}
                  activeDot={MODERN_ACTIVE_DOT}
                  {...MODERN_LINE_ANIMATION}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className={`${CHART_STAGE_CLASS} flex items-center justify-center text-sm text-lux-muted`}>
          No Sauda records in the last 30 days.
        </div>
      )}
    </div>
  );
};

export default AgentDailySaudaChart;
