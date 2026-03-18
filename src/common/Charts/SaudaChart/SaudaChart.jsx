import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
      <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-lg">
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-[#8CC63F]">
          {payload[0].value} Saudas
        </p>
      </div>
    );
  }
  return null;
};

const SaudaChart = ({ apiUrl, chartType = "line", data: externalData }) => {
  const [internalData, setInternalData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (apiUrl && !externalData) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await api.get(apiUrl);
          const rawData = response.data?.data || response.data || [];
          
          // Process data for chart (count by date)
          const counts = {};
          rawData.forEach(item => {
            const date = new Date(item.createdAt || item.bidDate || item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            counts[date] = (counts[date] || 0) + 1;
          });
          
          const chartData = Object.entries(counts).map(([date, count]) => ({ date, count }));
          setInternalData(chartData);
        } catch (error) {
          console.error("Failed to fetch sauda chart data", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [apiUrl, externalData]);

  const data = useMemo(() => externalData || internalData, [externalData, internalData]);

  if (loading) return <div className="h-[300px] flex items-center justify-center text-slate-400">Loading chart...</div>;
  if (!data.length) return <div className="h-[300px] flex items-center justify-center text-slate-400">No data available for chart</div>;

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#8CC63F" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="count" stroke="#8CC63F" strokeWidth={3} dot={{ r: 4, fill: "#8CC63F" }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }

    // Default to Premium Area Chart
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorSauda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8CC63F" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8CC63F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="count" stroke="#8CC63F" strokeWidth={3} fillOpacity={1} fill="url(#colorSauda)" animationDuration={1500} />
      </AreaChart>
    );
  };

  return (
    <div className="w-full h-[300px] mt-4">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Sauda Count Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default SaudaChart;
