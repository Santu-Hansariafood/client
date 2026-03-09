import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import moment from "moment";

const SaudaChart = ({ apiUrl }) => {
  const [chartData, setChartData] = useState([]);
  const [view, setView] = useState("weekly");

  const fetchChartData = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl);
      const rawData = response.data;
      const processedData = processChartData(rawData, view);
      setChartData(processedData);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  }, [apiUrl, view]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const processChartData = (data, view) => {
    const groupedData = {};
    data.forEach((item) => {
      const dateKey = moment(item.createdAt).format("YYYY-MM-DD");
      if (!groupedData[dateKey]) groupedData[dateKey] = { sauda: 0 };
      groupedData[dateKey].sauda += 1;
    });

    const keys = Object.keys(groupedData).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const processed = keys.map((key) => ({
      date: key,
      sauda: groupedData[key].sauda,
    }));

    if (view === "weekly") {
      return processed.slice(-7);
    } else if (view === "monthly") {
      const month = moment().month();
      const monthKeys = keys.filter((key) => moment(key).month() === month);
      return monthKeys.map((key) => ({
        date: key,
        sauda: groupedData[key].sauda,
      }));
    } else if (view === "yearly") {
      const year = moment().year();
      const yearKeys = keys.filter((key) => moment(key).year() === year);
      return yearKeys.map((key) => ({
        date: key,
        sauda: groupedData[key].sauda,
      }));
    } else {
      return processed;
    }
  };

  return (
    <div className="rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-white/70 to-purple-100 backdrop-blur-md border border-blue-200 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow">
        Sauda Count Over Time
      </h2>
      <div className="flex space-x-4 mb-6 justify-center">
        {[
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
          { label: "Yearly", value: "yearly" },
        ].map((option) => (
          <button
            key={option.value}
            className={`px-4 py-2 rounded-full font-semibold transition-all shadow-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              view === option.value
                ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white scale-105"
                : "bg-white/60 text-blue-700 hover:bg-blue-100"
            }`}
            onClick={() => setView(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <defs>
            <linearGradient id="colorSauda" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="date"
            tickFormatter={(tick) => moment(tick).format("MMM DD")}
            tick={{ fill: "#374151", fontWeight: 600 }}
          />

          <YAxis
            tick={{ fill: "#374151", fontWeight: 600 }}
          />

          <Tooltip
            contentStyle={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #d1d5db",
            }}
            formatter={(value) => [`${value}`, "Sauda"]}
            labelFormatter={(label) =>
              `Date: ${moment(label).format("MMM DD, YYYY")}`
            }
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="sauda"
            stroke="url(#colorSauda)"
            strokeWidth={4}
            activeDot={{ r: 7 }}
            dot={{ strokeWidth: 2, fill: "#fff" }}
          />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SaudaChart;
