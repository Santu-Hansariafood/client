import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const SaudaChart = ({ data }) => {
  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
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
            animationBegin={200}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SaudaChart;
