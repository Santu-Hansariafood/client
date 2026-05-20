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
  Legend,
} from "recharts";
import api from "../../../utils/apiClient/apiClient";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl p-4 shadow-2xl border border-slate-100 rounded-2xl min-w-[180px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm font-black text-slate-800 flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-slate-600">{entry.name}:</span>
              </span>
              <span style={{ color: entry.color }}>
                Rs. {entry.value.toLocaleString("en-IN")}
              </span>
            </p>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-900 flex items-center justify-between">
              <span>Total:</span>
              <span>
                Rs.{" "}
                {(payload[0].value + payload[1].value).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const PaymentAnalyticsChart = ({ days = 30, chartType = "line" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get("/payments/analytics", {
          params: { days },
        });
        const processedData = response.data.map((item) => ({
          date: new Date(item._id).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          pending: item.pending,
          received: item.received,
          rawDate: item._id,
        }));
        setData(processedData);
      } catch (error) {
        console.error("Failed to fetch payment analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [days]);

  if (loading)
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );

  if (!data.length)
    return (
      <div className="h-[350px] flex flex-col items-center justify-center text-slate-400">
        <p className="font-bold uppercase tracking-widest text-xs">
          No payment data for this period
        </p>
      </div>
    );

  return (
    <div className="h-[400px] w-full mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">
          Payment <span className="text-emerald-600">Settlement Trend</span>
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-100"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-100"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Received
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar
              dataKey="pending"
              name="Pending"
              fill="#fbbf24"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            <Bar
              dataKey="received"
              name="Received"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        ) : (
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pending"
              name="Pending"
              stroke="#fbbf24"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorPending)"
              animationDuration={2000}
            />
            <Area
              type="monotone"
              dataKey="received"
              name="Received"
              stroke="#10b981"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorReceived)"
              animationDuration={2000}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentAnalyticsChart;
