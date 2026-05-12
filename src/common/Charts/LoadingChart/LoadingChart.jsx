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
      <div className="bg-white/95 backdrop-blur-xl p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[150px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
              <span className="text-slate-600">Weight:</span>
            </span>
            <span className="text-blue-600">{payload[0].value.toFixed(2)} T</span>
          </p>
          {payload[1] && (
            <div className="pt-2 mt-2 border-t border-slate-50">
              <p className="text-sm font-black text-slate-800 flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                  <span className="text-slate-600">Entries:</span>
                </span>
                <span className="text-emerald-600">{payload[1].value}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const LoadingChart = ({ apiUrl, chartType = "line", data: externalData }) => {
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
          console.error("Failed to fetch loading chart data", error);
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
          const date = new Date(item.loadingDate || item.createdAt);
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
              stats[key] = { weight: 0, count: 0, sortKey };
            }
            stats[key].weight += Number(item.loadingWeight) || 0;
            stats[key].count += 1;
          }
        });

        const chartData = Object.entries(stats)
          .map(([date, stat]) => ({
            date,
            weight: stat.weight,
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <filter id="shadow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} 
            dy={10} 
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar 
            dataKey="weight" 
            fill="url(#barGradient)" 
            radius={[6, 6, 0, 0]} 
            barSize={viewType === 'weekly' ? 40 : 20} 
            filter="url(#shadow)"
          />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <filter id="areaShadow" height="200%">
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
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} 
          dy={10} 
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#2563eb"
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorWeight)"
          animationDuration={2000}
          filter="url(#areaShadow)"
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full h-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
            Loading Analytics
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Performance by {viewType}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {["weekly", "monthly", "quarterly", "yearly"].map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest ${
                viewType === type
                  ? "bg-white text-blue-600 shadow-xl scale-105"
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
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No loading data for this period</p>
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

export default LoadingChart;
