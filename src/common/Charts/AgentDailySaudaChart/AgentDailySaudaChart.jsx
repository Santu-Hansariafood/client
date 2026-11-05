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

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatCompactCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;

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
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
            >
              <CartesianGrid stroke="#eee8d9" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                yAxisId="saudas"
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                width={38}
              />
              <YAxis
                yAxisId="value"
                orientation="right"
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 10 }}
                width={64}
              />
              <Tooltip
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date
                    ? new Date(
                        `${payload[0].payload.date}T12:00:00`,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : ""
                }
                formatter={(value, name) => [
                  name === "Value" ? formatCurrency(value) : value,
                  name,
                ]}
              />
              <Legend />
              <Bar
                yAxisId="saudas"
                dataKey="saudas"
                name="Saudas"
                fill="#0f766e"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="value"
                dataKey="value"
                name="Value"
                type="monotone"
                stroke="#b7791f"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center text-sm text-lux-muted">
          No Sauda records in the last 30 days.
        </div>
      )}
    </div>
  );
};

export default AgentDailySaudaChart;
