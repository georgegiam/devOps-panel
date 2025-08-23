export interface StatusCheck {
  id: string;
  region: string;
  timestamp: string;
  responseTime: number;
  statusCode: number;
  isOnline: boolean;
}

export interface RegionSummary {
  region: string;
  status: "online" | "offline" | "unknown";
  lastCheck: string | null;
  responseTime: number | null;
  statusCode: number | null;
}
