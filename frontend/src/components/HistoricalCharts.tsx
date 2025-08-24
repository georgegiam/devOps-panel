import type { StatusCheck } from "../types";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

interface HistoricalChartsProps {
  historical: StatusCheck[];
}

const HistoricalCharts: React.FC<HistoricalChartsProps> = ({ historical }) => {
  // group data by region
  const grouped: Record<string, StatusCheck[]> = {};
  historical.forEach((check) => {
    if (!grouped[check.region]) grouped[check.region] = [];
    grouped[check.region].push(check);
  });

  return (
    <div className="row">
      {Object.entries(grouped).map(([region, data]) => (
        <div key={region} className="col-12 mb-4">
          <h5>{region}</h5>
          <div className="card shadow-sm p-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => dayjs(ts).format("HH:mm")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(ts) => dayjs(ts).format("YYYY-MM-DD HH:mm")}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#0d6efd"
                  name="Response Time (ms)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoricalCharts;
