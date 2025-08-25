export interface StatusCheck {
  id: string;
  region: string;
  endpoint: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
  isOnline: boolean;
  stats: string | null;
  error?: string;
}

export interface Region {
  name: string;
  endpoint: string;
}

export interface MonitoringStats {
  totalChecks: number;
  successfulChecks: number;
  uptime: number;
  averageResponseTime: number;
  lastCheck: Date;
}

export const REGIONS: Region[] = [
  {
    name: "us-east",
    endpoint: "https://data--us-east.upscope.io/status?stats=1",
  },
  {
    name: "eu-west",
    endpoint: "https://data--eu-west.upscope.io/status?stats=1",
  },
  {
    name: "eu-central",
    endpoint: "https://data--eu-central.upscope.io/status?stats=1",
  },
  {
    name: "us-west",
    endpoint: "https://data--us-west.upscope.io/status?stats=1",
  },
  {
    name: "sa-east",
    endpoint: "https://data--sa-east.upscope.io/status?stats=1",
  },
  {
    name: "ap-southeast",
    endpoint: "https://data--ap-southeast.upscope.io/status?stats=1",
  },
];
