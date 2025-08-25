import type { StatusCheck } from "../types";
import { useEffect, useState } from "react";
import { api, socket } from "../api/client";

function latestPerRegion(checks: StatusCheck[]): StatusCheck[] {
  const byRegion: Record<string, StatusCheck> = {};
  for (const c of checks) {
    const key = c.region;
    const cur = byRegion[key];
    if (
      !cur ||
      new Date(c.timestamp as any).getTime() >
        new Date(cur.timestamp as any).getTime()
    ) {
      byRegion[key] = c;
    }
  }
  return Object.values(byRegion);
}

// runs when the frontent starts
export function useMonitoring() {
  const [liveData, setLiveData] = useState<StatusCheck[]>([]);
  const [historical, setHistorical] = useState<StatusCheck[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const lastHour = await api.get<StatusCheck[]>("/api/recent?hours=1");
        setLiveData(latestPerRegion(lastHour.data));

        const pastWeek = await api.get<StatusCheck[]>("/api/recent?hours=168");
        setHistorical(pastWeek.data);
      } catch (e) {
        console.error(e);
      }
    })();

    const handleUpdate = (data: StatusCheck[]) => {
      setLiveData(latestPerRegion(data));
      setHistorical((prev) => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const merged = [...prev, ...data];
        return merged.filter(
          (c) => new Date(c.timestamp as any).getTime() >= cutoff
        );
      });
    };

    socket.on("status-update", handleUpdate);

    return () => {
      socket.off("status-update", handleUpdate);
    };
  }, []);

  return { liveData, historical };
}
