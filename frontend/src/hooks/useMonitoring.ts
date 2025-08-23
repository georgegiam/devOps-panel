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

    // Fetch historical data
    api
      .get<StatusCheck[]>("/api/recent")
      .then((res) => setHistorical(res.data))
      .catch(console.error);

    // Listen for live updates
    const handleUpdate = (data: StatusCheck[]) => setLiveData(data);
    socket.on("status-update", handleUpdate);

    // Cleanup: remove the event listener when component unmounts
    return () => {
      socket.off("status-update", handleUpdate);
    };
  }, []);

  return { liveData, summary, historical };
}
