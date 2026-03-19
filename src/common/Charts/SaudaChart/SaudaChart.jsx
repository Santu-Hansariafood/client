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
        const counts = {};
        const today = new Date();

        rawData.forEach((item) => {
          const date = new Date(item.createdAt || item.bidDate || item.date);
          let key;

          if (viewType === "weekly") {
            // Group by day of the last 7 days
            const diff = today - date;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (daysDiff <= 7) {
              key = date.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
              });
            }
          } else if (viewType === "monthly") {
            // Group by week of the current month or just by date for the month
            key = date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            });
          } else if (viewType === "yearly") {
            // Group by month
            key = date.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            });
          }

          if (key) {
            counts[key] = (counts[key] || 0) + 1;
          }
        });

        // Sort data based on viewType
        const sortedEntries = Object.entries(counts);
        if (viewType === "yearly") {
          sortedEntries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
        } else {
          // For weekly/monthly, we might want to keep chronological order if possible
          // Simplest is to sort by date if the keys allow it, or just keep as is
        }

        const chartData = sortedEntries.map(([date, count]) => ({
          date,
          count,
        }));
        setInternalData(chartData);
      };
      processData();
    }
  }, [rawData, viewType]);

  const data = useMemo(
    () => externalData || internalData,
    [externalData, internalData]
  );

  if (loading)
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        Loading chart...
      </div>
    );

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#8CC63F" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8CC63F"
            strokeWidth={3}
            dot={{ r: 4, fill: "#8CC63F" }}
            activeDot={{ r: 6 }}
          />
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
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#8CC63F"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorSauda)"
          animationDuration={1500}
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full h-auto mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Sauda Count Over Time
        </h3>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm self-end sm:self-auto">
          {["weekly", "monthly", "yearly"].map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${
                viewType === type
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        {!data.length ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            No data available for chart
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
