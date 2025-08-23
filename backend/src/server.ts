import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cron from "node-cron";

// Load environment variables FIRST
dotenv.config();

import MonitoringService from "./services/monitoring";
import FirebaseService from "./services/firebase";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Socket.IO for monitoring service
MonitoringService.setSocketServer(io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current health summary to new client
  MonitoringService.getHealthSummary()
    .then((summary) => {
      socket.emit("health-summary", summary);
    })
    .catch((error) => {
      console.error("Error sending health summary to new client:", error);
    });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Handle client requesting recent data
  socket.on("get-recent-data", async (region?: string, hours: number = 24) => {
    try {
      const recentChecks = await FirebaseService.getRecentChecks(region, hours);
      socket.emit("recent-data", recentChecks);
    } catch (error) {
      console.error("Error fetching recent data:", error);
      socket.emit("error", { message: "Failed to fetch recent data" });
    }
  });
});

// REST API Routes
app.get("/", (req, res) => {
  res.json({
    message: "Server Monitoring API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const summary = await MonitoringService.getHealthSummary();
    res.json(summary);
  } catch (error) {
    console.error("Error in /api/health:", error);
    res.status(500).json({ error: "Failed to get health summary" });
  }
});

app.get("/api/recent/:region?", async (req, res) => {
  try {
    const region = req.params.region;
    const hours = parseInt(req.query.hours as string) || 24;

    const recentChecks = await FirebaseService.getRecentChecks(region, hours);
    res.json(recentChecks);
  } catch (error) {
    console.error("Error in /api/recent:", error);
    res.status(500).json({ error: "Failed to fetch recent data" });
  }
});

// Manual trigger for testing
app.post("/api/check-now", async (req, res) => {
  try {
    console.log("Manual monitoring check triggered");
    const results = await MonitoringService.checkAllEndpoints();
    res.json({
      message: "Check completed successfully",
      results: results.map((r) => ({
        region: r.region,
        isOnline: r.isOnline,
        responseTime: r.responseTime,
        statusCode: r.statusCode,
      })),
    });
  } catch (error) {
    console.error("Error in manual check:", error);
    res.status(500).json({ error: "Failed to perform manual check" });
  }
});

// Scheduled monitoring - every hour
cron.schedule("0 * * * *", async () => {
  try {
    await MonitoringService.checkAllEndpoints();
  } catch (error) {
    console.error("Scheduled monitoring failed:", error);
  }
});

// Daily cleanup of old data - runs at 2 AM
cron.schedule("0 2 * * *", async () => {
  try {
    console.log("Starting daily cleanup...");
    await FirebaseService.cleanupOldData();
  } catch (error) {
    console.error("Daily cleanup failed:", error);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Monitoring 6 endpoints every 1 hour`);
  console.log(`Data retention: 7 days`);
  console.log(`WebSocket enabled for real time updates`);

  // Run initial check
  setTimeout(() => {
    MonitoringService.checkAllEndpoints().catch((error) =>
      console.error("Initial check failed:", error)
    );
  }, 5000);
});

export default app;
