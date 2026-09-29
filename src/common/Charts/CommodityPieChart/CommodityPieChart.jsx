import { useState, useEffect, useMemo, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FaBalanceScale } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";

import {
  CHART_AREA_CLASS,
  CHART_LOADING_CLASS,
  ChartPanelHeader,
  ChartSpinner,
  ChartSkeleton,
  ChartEmptyState,
} from "../chartLayoutShared";
import { useResponsiveChartConfig } from "../modernBarChartShared";

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
      <div className="relative bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[150px] animate-pop-in">
        <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-white border-t border-l border-slate-100" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {data.name}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: payload[0].color }}
              />
              <span className="text-slate-600">Weight:</span>
            </span>
            <span className="text-blue-600 tabular-nums">
              {data.value.toFixed(3)}
              <span className="text-[10px] font-bold text-blue-600/70 ml-1">
                MT
              </span>
            </span>
          </p>
          <div className="pt-2 mt-2 border-t border-slate-50">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>Volume Share:</span>
              <span className="text-slate-900 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md tabular-nums font-black">
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
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const processingRef = useRef(null);
  const responsiveCfg = useResponsiveChartConfig();

  useEffect(() => {
    if (!apiUrl) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await api.get(apiUrl);
        if (!cancelled) {
          const fetchedData = response.data?.data || response.data || [];
          setRawData(fetchedData);
          setFirstLoad(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch commodity distribution data", err);
          setFirstLoad(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (rawData.length === 0) {
      setData([]);
      return;
    }

    if (processingRef.current) {
      clearTimeout(processingRef.current);
    }

    processingRef.current = setTimeout(() => {
      const stats = new Map();
      let totalWeight = 0;

      for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        const commodity = item.commodity || "Unknown";
        const weight = Number(item.loadingWeight || item.quantity) || 0;

        stats.set(commodity, (stats.get(commodity) || 0) + weight);
        totalWeight += weight;
      }

      const chartData = Array.from(stats.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage:
            totalWeight > 0 ? ((value / totalWeight) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.value - a.value);

      setData(chartData);
    }, 80);

    return () => {
      if (processingRef.current) clearTimeout(processingRef.current);
    };
  }, [rawData]);

  if (firstLoad) {
    return <ChartSkeleton rows={0} />;
  }

  if (loading && !firstLoad)
    return (
      <div className={CHART_LOADING_CLASS}>
        <ChartSpinner colorClass="border-emerald-600" subtitle="Refreshing commodity distribution" />
      </div>
    );

  const radius = responsiveCfg.showFullLegend
    ? { inner: "54%", outer: "80%" }
    : { inner: "48%", outer: "72%" };

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <ChartPanelHeader
        accentClass="bg-emerald-600"
        title="Commodity Distribution"
        subtitle="Volume share by commodity type"
        icon={FaBalanceScale}
      />

      <div className={`${CHART_AREA_CLASS} rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-emerald-50/20 to-white border border-slate-100 shadow-sm overflow-hidden`}>
        {!data.length ? (
          <ChartEmptyState
            title="No commodity data available"
            subtitle="Volume distribution will appear here once data is available."
            Icon={FaBalanceScale}
          />
        ) : (
          <div className="w-full h-full p-2 sm:p-3 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart className="animate-fade-in">
                <defs>
                  <filter id="commodityPieShadow" height="200%">
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="3.5"
                      result="blur"
                    />
                    <feOffset in="blur" dx="0" dy="6" result="offsetBlur" />
                    <feMerge>
                      <feMergeNode in="offsetBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={radius.inner}
                  outerRadius={radius.outer}
                  paddingAngle={data.length > 6 ? 3 : 5}
                  dataKey="value"
                  animationDuration={1800}
                  stroke="none"
                  filter="url(#commodityPieShadow)"
                >
                  {data.map((entry, index) => (
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
                  layout="horizontal"
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
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommodityPieChart;
