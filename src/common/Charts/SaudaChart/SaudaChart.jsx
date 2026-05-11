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
import api from "../../../utils/apiClient/apiClient";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 shadow-2xl border border-slate-100 rounded-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {payload[0].value} Saudas
          </p>
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
  const [viewType, setViewType] = useState("monthly");

  useEffect(() => {
    if (apiUrl && !externalData) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await api.get(apiUrl);
          const data = response.data?.data || response.data || [];
          setRawData(data);
        } catch (error) {
          console.error("Failed to fetch sauda chart data", error);
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
          const date = new Date(item.createdAt || item.date);
          let key;
          let sortKey;

          if (viewType === "weekly") {
            const diff = today - date;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
              key = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
              sortKey = date.getTime();
            }
          } else if (viewType === "monthly") {
            const diff = today - date;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 30) {
              key = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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
            key = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
            sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
          }

          if (key) {
            if (!stats[key]) {
              stats[key] = { count: 0, sortKey };
            }
            stats[key].count += 1;
          }
        });

        const chartData = Object.entries(stats)
          .map(([date, stat]) => ({
            date,
            count: stat.count,
            sortKey: stat.sortKey
          }))
          .sort((a, b) => a.sortKey - b.sortKey);

        setInternalData(chartData);
      };
      processData();
    }
  }, [rawData, viewType]);

  const data = useMemo(() => externalData || internalData, [externalData, internalData]);

  if (loading) return (
    <div className="h-[350px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: -20, bottom: 0 },
    };

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <defs>
            <filter id="barShadow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="saudaBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar 
            dataKey="count" 
            fill="url(#saudaBarGradient)" 
            radius={[6, 6, 0, 0]} 
            barSize={viewType === 'weekly' ? 40 : 20} 
            filter="url(#barShadow)"
          />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorSauda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <filter id="saudaAreaShadow" height="200%">
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#059669"
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorSauda)"
          animationDuration={2000}
          filter="url(#saudaAreaShadow)"
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full h-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-4 bg-emerald-600 rounded-full"></span>
            Sauda Activity
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Market momentum by {viewType}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {["weekly", "monthly", "quarterly", "yearly"].map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest ${
                viewType === type
                  ? "bg-white text-emerald-600 shadow-xl scale-105"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[350px]">
        {!data.length ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No sauda data for this period</p>
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

export default SaudaChart;
