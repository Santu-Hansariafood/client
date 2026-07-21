import { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import {
  CHART_AREA_CLASS,
  CHART_LOADING_CLASS,
  ChartPanelHeader,
  ChartSpinner,
} from "../chartLayoutShared";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-xl p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[150px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {data.name}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: payload[0].color }}
              ></span>
              <span className="text-slate-600">Weight:</span>
            </span>
            <span className="text-blue-600">{data.value.toFixed(2)} T</span>
          </p>
          <div className="pt-2 mt-2 border-t border-slate-50">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>Volume Share:</span>
              <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {data.percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CommodityPieChart = ({ apiUrl }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        clearApiCache();
        const response = await api.get(apiUrl);
        const rawData = response.data?.data || response.data || [];

        const stats = {};
        let totalWeight = 0;

        rawData.forEach((item) => {
          const commodity = item.commodity || "Unknown";
          const weight = Number(item.loadingWeight || item.quantity) || 0;

          if (!stats[commodity]) {
            stats[commodity] = 0;
          }
          stats[commodity] += weight;
          totalWeight += weight;
        });

        const chartData = Object.entries(stats)
          .map(([name, value]) => ({
            name,
            value,
            percentage:
              totalWeight > 0 ? ((value / totalWeight) * 100).toFixed(1) : 0,
          }))
          .sort((a, b) => b.value - a.value);

        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch commodity distribution data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiUrl]);

  if (loading)
    return (
      <div className={CHART_LOADING_CLASS}>
        <ChartSpinner colorClass="border-emerald-600" />
      </div>
    );

  return (
    <div className="w-full min-w-0">
      <ChartPanelHeader
        accentClass="bg-emerald-600"
        title="Commodity Distribution"
        subtitle="Volume share by commodity type"
      />

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
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.488 9H15V1.512A9.025 9.001 0 0120.488 9z"
                ></path>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">
              No data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="pieShadow" height="200%">
                  <feGaussianBlur
                    in="SourceAlpha"
                    stdDeviation="3"
                    result="blur"
                  />
                  <feOffset in="blur" dx="0" dy="5" result="offsetBlur" />
                  <feMerge>
                    <feMergeNode in="offsetBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="76%"
                paddingAngle={8}
                dataKey="value"
                animationDuration={2000}
                stroke="none"
                filter="url(#pieShadow)"
              >
                {data.map((entry, index) => (
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
                layout="horizontal"
                formatter={(value) => (
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    {value}
                  </span>
                )}
                wrapperStyle={{ paddingTop: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CommodityPieChart;
