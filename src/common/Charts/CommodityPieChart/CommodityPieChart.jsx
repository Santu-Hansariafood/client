import { useState, useEffect, useMemo, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
} from "recharts";
import { FaBalanceScale } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";

import {
  CHART_LOADING_CLASS,
  CHART_STAGE_CLASS,
  CHART_STAGE_INNER_CLASS,
  ChartPanelHeader,
  ChartSpinner,
  ChartSkeleton,
  ChartEmptyState,
  PieCenterLabel,
} from "../chartLayoutShared";
import {
  PieGradientDefs,
  MODERN_PIE_ANIMATION,
  pieDepthColor,
  useResponsiveChartConfig,
} from "../modernBarChartShared";

const COLORS = [
  "#065f46",
  "#0d7a68",
  "#12a594",
  "#c9a227",
  "#e6cf86",
  "#b8860b",
  "#04392c",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="relative bg-lux-cream/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl border border-[#e9e2d3] rounded-2xl min-w-[150px] animate-pop-in">
        <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-lux-cream border-t border-l border-[#e9e2d3]" />
        <p className="text-[10px] font-black text-lux-gold uppercase tracking-widest mb-2 border-b border-[#ece4d2] pb-2">
          {data.name}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-lux-ink flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: payload[0].color }}
              />
              <span className="text-lux-muted">Weight:</span>
            </span>
            <span className="font-serif text-base font-semibold text-lux-emerald tabular-nums">
              {data.value.toFixed(3)}
              <span className="text-[10px] font-bold text-lux-emerald/70 ml-1">
                MT
              </span>
            </span>
          </p>
          <div className="pt-2 mt-2 border-t border-[#ece4d2]">
            <div className="flex items-center justify-between text-[10px] font-bold text-lux-muted">
              <span>Volume Share:</span>
              <span className="text-lux-emerald bg-lux-emerald/10 px-2 py-0.5 rounded-md tabular-nums font-black">
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
        <ChartSpinner colorClass="border-lux-emerald" subtitle="Refreshing commodity distribution" />
      </div>
    );

  const radius = responsiveCfg.showFullLegend
    ? { inner: "54%", outer: "80%" }
    : { inner: "48%", outer: "72%" };

  const pieTotal = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <ChartPanelHeader
        accentClass="bg-gradient-to-b from-lux-gold to-lux-emerald"
        title="Commodity Distribution"
        subtitle="Volume share by commodity type"
        icon={FaBalanceScale}
      />

      <div className={CHART_STAGE_CLASS}>
        {!data.length ? (
          <ChartEmptyState
            title="No commodity data available"
            subtitle="Volume distribution will appear here once data is available."
            Icon={FaBalanceScale}
          />
        ) : (
          <div className={CHART_STAGE_INNER_CLASS}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart className="animate-fade-in">
                <PieGradientDefs idPrefix="commodityPie" colors={COLORS} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="48%"
                  innerRadius={radius.inner}
                  outerRadius={radius.outer}
                  paddingAngle={data.length > 6 ? 3 : 5}
                  dataKey="value"
                  isAnimationActive={false}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`commodity-pie-depth-${entry.name}`}
                      fill={pieDepthColor(COLORS[index % COLORS.length])}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="44%"
                  innerRadius={radius.inner}
                  outerRadius={radius.outer}
                  paddingAngle={data.length > 6 ? 3 : 5}
                  dataKey="value"
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth={1.5}
                  filter="url(#commodityPie-shadow)"
                  {...MODERN_PIE_ANIMATION}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#commodityPie-g-${index % COLORS.length})`}
                    />
                  ))}
                  <Label
                    position="center"
                    content={
                      <PieCenterLabel
                        value={pieTotal.toFixed(0)}
                        caption="MT Loaded"
                      />
                    }
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#065f46", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  layout="horizontal"
                  iconSize={responsiveCfg.showFullLegend ? 9 : 7}
                  formatter={(value) => (
                    <span
                      className={`font-serif font-semibold text-lux-muted ${
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
