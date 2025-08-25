import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cron from "node-cron";

dotenv.config();

// services
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

app.use(cors());
app.use(express.json());

// set up Socket.IO for monitoring service
MonitoringService.setSocketServer(io);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // send current health summary to new client
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

  // handle client requesting recent data
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

// server is running
app.get("/", (req, res) => {
  res.json({
    message: "Server Monitoring API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// check the health for the last hour
app.get("/api/health", async (req, res) => {
  try {
    const summary = await MonitoringService.getHealthSummary();
    res.json(summary);
  } catch (error) {
    console.error("Error in /api/health:", error);
    res.status(500).json({ error: "Failed to get health summary" });
  }
});

// fetch recent data for an endpoint (or all endpoints)
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

// manual endpoint check (for testing)
app.post("/api/check-now", async (req, res) => {
  try {
    console.log("Manual monitoring check triggered");
    const results = await MonitoringService.checkAllEndpoints();

    if (results.length === 0) {
      res.json({
        message:
          "Check was not performed (likely because another process is already running a check)",
        results: [],
        note: "This prevents duplicate monitoring cycles across multiple processes",
      });
      return;
    }

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

// scheduled monitoring every hour
if (process.env.IS_PRIMARY_MONITOR === "true") {
  console.log("Primary server: Setting up scheduled jobs...");

  // Main monitoring cycle - runs at the top of every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Scheduled monitoring cycle triggered");
    try {
      await MonitoringService.checkAllEndpoints();
    } catch (error) {
      console.error("Scheduled monitoring failed:", error);
    }
  });

  // Daily cleanup of old data (runs at 2 AM)
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("Starting daily cleanup...");
      await FirebaseService.cleanupOldData();
    } catch (error) {
      console.error("Daily cleanup failed:", error);
    }
  });

  // Clean up expired locks every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      await FirebaseService.cleanupExpiredLocks();
    } catch (error) {
      console.error("Lock cleanup failed:", error);
    }
  });

  console.log("✅ Primary server: All scheduled jobs configured");
} else {
  console.log("Secondary server: Skipping all scheduled jobs");
}

// start server confirmation
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Process ID for distributed locking: Internal ID will be generated`
  );

  // Run initial check after a short delay
  // The distributed lock will prevent duplicates even if multiple processes try this
  setTimeout(async () => {
    try {
      console.log("Running initial monitoring check...");
      const results = await MonitoringService.checkAllEndpoints();
      if (results.length === 0) {
        console.log(
          "Initial check was skipped (another process may have been running a check)"
        );
      } else {
        console.log("Initial check completed successfully");
      }
    } catch (error) {
      console.error("Initial check failed:", error);
    }
  }, 5000);
});

export default app;
