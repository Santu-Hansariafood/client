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
    <div className="bg-white shadow-md rounded-md p-4">
      <h2 className="text-xl text-center font-semibold mb-4">
        Sauda Count Over Time
      </h2>
      <div className="flex space-x-4 mb-4 justify-center">
        {["weekly", "monthly", "yearly"].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="view"
              value={option}
              checked={view === option}
              onChange={(e) => setView(e.target.value)}
              className="mr-2"
            />
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(tick) => moment(tick).format("MMM DD")}
            label={{ value: "Date", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis
            label={{
              value: "Sauda Count",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value) => [`${value}`, "Sauda"]}
            labelFormatter={(label) =>
              `Date: ${moment(label).format("MMM DD, YYYY")}`
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sauda"
            stroke="#2cf005"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SaudaChart;
