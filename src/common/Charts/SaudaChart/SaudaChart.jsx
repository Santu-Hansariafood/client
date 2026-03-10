import { useState, useEffect, useCallback } from "react";
import {
  Bar,
  BarChart,
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

const SaudaChart = ({ apiUrl, chartType = "line" }) => {
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
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Sauda Count Over Time
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Track sauda creation trend by date
          </p>
        </div>

        <div className="inline-flex w-fit items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
          {[
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
            { label: "Yearly", value: "yearly" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                view === option.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 20, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => moment(tick).format("MMM DD")}
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value) => [`${value}`, "Sauda"]}
                  labelFormatter={(label) =>
                    moment(label).format("MMM DD, YYYY")
                  }
                />
                <Legend />
                <Bar dataKey="sauda" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 20, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="colorSauda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => moment(tick).format("MMM DD")}
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />

                <YAxis
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value) => [`${value}`, "Sauda"]}
                  labelFormatter={(label) =>
                    moment(label).format("MMM DD, YYYY")
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="sauda"
                  stroke="#16a34a"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={false}
                />
              </LineChart>
            )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SaudaChart;
