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

const BidChart = ({ apiUrl }) => {
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
      if (!groupedData[dateKey]) groupedData[dateKey] = { bid: 0 };
      groupedData[dateKey].bid += 1;
    });

    const keys = Object.keys(groupedData).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const processed = keys.map((key) => ({
      date: key,
      bid: groupedData[key].bid,
    }));

    if (view === "weekly") {
      return processed.slice(-7);
    } else if (view === "monthly") {
      return processed.slice(-30);
    } else if (view === "quarterly") {
      return processed.slice(-90);
    } else if (view === "yearly") {
      return processed.slice(-365);
    } else {
      return processed;
    }
  };

  return (
    <div className="rounded-2xl shadow-2xl bg-gradient-to-br from-yellow-100 via-white/70 to-pink-100 backdrop-blur-md border border-yellow-200 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow">
        Bid Count Over Time
      </h2>
      <div className="flex space-x-4 mb-6 justify-center">
        {[
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
          { label: "Quarterly", value: "quarterly" },
          { label: "Yearly", value: "yearly" },
        ].map((option) => (
          <button
            key={option.value}
            className={`px-4 py-2 rounded-full font-semibold transition-all shadow-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
              view === option.value
                ? "bg-gradient-to-r from-yellow-400 to-pink-400 text-white scale-105"
                : "bg-white/60 text-yellow-700 hover:bg-yellow-100"
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
          <CartesianGrid strokeDasharray="3 3" stroke="#fef08a" />
          <XAxis
            dataKey="date"
            tickFormatter={(tick) => moment(tick).format("MMM DD")}
            label={{ value: "Date", position: "insideBottomRight", offset: -5 }}
            tick={{ fill: "#eab308", fontWeight: 600 }}
          />
          <YAxis
            label={{
              value: "Bid Count",
              angle: -90,
              position: "insideLeft",
              fill: "#eab308",
              fontWeight: 600,
            }}
            tick={{ fill: "#eab308", fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{ background: "#fff", borderRadius: 12, border: "1px solid #fde68a" }}
            formatter={(value) => [`${value}`, "Bid"]}
            labelFormatter={(label) =>
              `Date: ${moment(label).format("MMM DD, YYYY")}`
            }
          />
          <Legend wrapperStyle={{ color: "#eab308", fontWeight: 700 }} />
          <Line
            type="monotone"
            dataKey="bid"
            stroke="#eab308"
            strokeWidth={3}
            activeDot={{ r: 8 }}
            dot={{ stroke: "#eab308", strokeWidth: 2, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BidChart;
