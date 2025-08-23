import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyPoint {
  date: string; // YYYY-MM-DD
  avgResponseTime: number;
}

const HistoricalCharts: React.FC = () => {
  const [dataByRegion, setDataByRegion] = useState<
    Record<string, DailyPoint[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyAggregates = async () => {
      try {
        const response = await axios.get<Record<string, DailyPoint[]>>(
          "/api/daily-aggregates-by-region"
        );
        const fetchedData = response.data;

        const sanitized: Record<string, DailyPoint[]> = {};
        Object.entries(fetchedData).forEach(([region, points]) => {
          // Only keep valid arrays with points
          if (Array.isArray(points) && points.length > 0) {
            sanitized[region] = points.slice(-7); // last 7 points
          }
        });

        setDataByRegion(sanitized);
      } catch (err) {
        console.error("Failed to fetch daily aggregates:", err);
        setDataByRegion({});
      } finally {
        setLoading(false);
      }
    };

    fetchDailyAggregates();
  }, []);

  if (loading) return <p>Loading daily aggregates...</p>;
  if (Object.keys(dataByRegion).length === 0)
    return <p>No daily data available.</p>;

  return (
    <div className="row">
      {Object.entries(dataByRegion).map(([region, data]) => (
        <div key={region} className="col-12 mb-4">
          <h5>{region}</h5>
          <div className="card shadow-sm p-3">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#0d6efd"
                    name="Avg Response Time"
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No daily data available for this region</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoricalCharts;
