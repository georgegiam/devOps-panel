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
  // Group by region
  const grouped: Record<string, StatusCheck[]> = {};
  historical.forEach((check) => {
    if (!grouped[check.region]) grouped[check.region] = [];
    grouped[check.region].push(check);
  });

  return (
    <div className="row">
      {Object.entries(grouped).map(([region, raw]) => {
        // Sort by time asc and map to numeric time "t"
        const data = [...raw]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .map((d) => ({
            ...d,
            t: new Date(d.timestamp).getTime(), // numeric x
          }));

        if (data.length === 0) {
          return (
            <div key={region} className="col-12 mb-4">
              <h5>{region}</h5>
              <div className="card shadow-sm p-3">
                <p>No data available for this region.</p>
              </div>
            </div>
          );
        }

        // Build daily ticks (midnight) within data range, last 7 days max
        const start = dayjs(data[0].t).startOf("day");
        const end = dayjs(data[data.length - 1].t).endOf("day");
        const ticks: number[] = [];
        let cursor = end.startOf("day"); // start from the most recent midnight
        for (let i = 0; i < 7; i++) {
          const ts = cursor.valueOf();
          if (ts >= start.valueOf() && ts <= end.valueOf()) {
            ticks.unshift(ts); // keep chronological order left->right
          }
          cursor = cursor.subtract(1, "day");
        }

        return (
          <div key={region} className="col-12 mb-4">
            <h5>{region}</h5>
            <div className="card shadow-sm p-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    ticks={ticks}
                    tickFormatter={(ms) => dayjs(ms).format("ddd")}
                    allowDecimals={false}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(ms) =>
                      dayjs(ms as number).format("YYYY-MM-DD HH:mm")
                    }
                    formatter={(val: number, name) =>
                      name === "responseTime"
                        ? [`${val} ms`, "Response Time"]
                        : [val, name]
                    }
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
        );
      })}
    </div>
  );
};

export default HistoricalCharts;
