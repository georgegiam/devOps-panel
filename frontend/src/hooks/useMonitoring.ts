import type { StatusCheck, RegionSummary } from "../types";
import { useEffect, useState } from "react";
import { api, socket } from "../api/client";

export function useMonitoring() {
  const [liveData, setLiveData] = useState<StatusCheck[]>([]);
  const [summary, setSummary] = useState<RegionSummary[]>([]);
  const [historical, setHistorical] = useState<StatusCheck[]>([]);

  useEffect(() => {
    // Fetch initial health summary
    api
      .get<RegionSummary[]>("/api/health")
      .then((res) => setSummary(res.data))
      .catch(console.error);

    // Fetch historical data (past week)
    api
      .get<StatusCheck[]>("/api/recent")
      .then((res) => setHistorical(res.data))
      .catch(console.error);

    // WebSocket listener for live updates
    const handleUpdate = (data: StatusCheck[]) => {
      // Update live data
      setLiveData(data);

      // Append new data to historical array, keep last 7 days
      setHistorical((prev) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const combined = [...prev, ...data].filter(
          (check) => new Date(check.timestamp) >= cutoff
        );
        return combined;
      });
    };

    socket.on("status-update", handleUpdate);

    // Cleanup listener on unmount
    return () => {
      socket.off("status-update", handleUpdate);
    };
  }, []);

  // Stable live display: fallback to last known summary if no live data
  const displayLiveData =
    liveData.length > 0
      ? liveData
      : summary.map((s) => ({
          id: s.region,
          region: s.region,
          timestamp: s.lastCheck || new Date().toISOString(),
          responseTime: s.responseTime || 0,
          statusCode: s.statusCode || 0,
          isOnline: s.status === "online",
        }));

  return { liveData: displayLiveData, historical };
}
