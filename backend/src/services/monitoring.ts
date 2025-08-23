import axios, { AxiosResponse } from "axios";
import { v4 as uuidv4 } from "uuid";
import { StatusCheck, Region, REGIONS } from "../types";
import FirebaseService from "./firebase";
import { Server } from "socket.io";

class MonitoringService {
  private io: Server | null = null;

  setSocketServer(io: Server) {
    this.io = io;
  }

  // Check a single region
  async checkEndpoint(region: Region): Promise<StatusCheck> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      console.log(`Checking ${region.name}...`);

      const response: AxiosResponse = await axios.get(region.endpoint, {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      const responseTime = Date.now() - startTime;
      const isOnline = response.status >= 200 && response.status < 400;

      const statusCheck: StatusCheck = {
        id: uuidv4(),
        region: region.name,
        endpoint: region.endpoint,
        timestamp,
        responseTime,
        statusCode: response.status,
        isOnline,
        stats: response.data || null,
      };

      console.log(`${region.name}: ${response.status} (${responseTime}ms)`);
      return statusCheck;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const statusCheck: StatusCheck = {
        id: uuidv4(),
        region: region.name,
        endpoint: region.endpoint,
        timestamp,
        responseTime,
        statusCode: 0,
        isOnline: false,
        error: error.message || "Unknown error",
      };

      console.log(
        `${region.name}: Error - ${error.message} (${responseTime}ms)`
      );
      return statusCheck;
    }
  }

  // Check all regions
  async checkAllEndpoints(): Promise<StatusCheck[]> {
    console.log(`\nStarting monitoring cycle at ${new Date().toISOString()}`);

    try {
      const results = await Promise.all(
        REGIONS.map((r) => this.checkEndpoint(r))
      );

      // Save to Firebase
      await Promise.all(results.map((r) => FirebaseService.saveStatusCheck(r)));

      // Emit live update
      if (this.io) {
        this.io.emit("status-update", results);
        console.log("Emitted status update to clients");
      }

      console.log(`Monitoring cycle completed successfully\n`);
      return results;
    } catch (error) {
      console.error("Error during monitoring cycle:", error);
      throw error;
    }
  }

  // Get health summary for all regions (most recent check)
  async getHealthSummary() {
    try {
      const recentChecks = await FirebaseService.getRecentChecks(undefined, 1); // last hour

      return REGIONS.map((region) => {
        const regionChecks = recentChecks.filter(
          (c) => c.region === region.name
        );
        if (regionChecks.length === 0)
          return {
            region: region.name,
            status: "unknown",
            lastCheck: null,
            responseTime: null,
          };

        const latest = regionChecks[0];
        return {
          region: region.name,
          status: latest.isOnline ? "online" : "offline",
          lastCheck: latest.timestamp,
          responseTime: latest.responseTime,
          statusCode: latest.statusCode,
        };
      });
    } catch (error) {
      console.error("Error getting health summary:", error);
      throw error;
    }
  }

  // --- Daily Aggregates for the last 7 days ---
  async getDailyAggregatesByRegion(): Promise<
    Record<string, { date: string; avgResponseTime: number }[]>
  > {
    try {
      // Fetch all checks for last 7 days
      const recentChecks = await FirebaseService.getRecentChecks(
        undefined,
        24 * 7
      );

      // Group by region and day
      const grouped: Record<string, Record<string, StatusCheck[]>> = {};
      recentChecks.forEach((check) => {
        const day = check.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
        if (!grouped[check.region]) grouped[check.region] = {};
        if (!grouped[check.region][day]) grouped[check.region][day] = [];
        grouped[check.region][day].push(check);
      });

      // Compute averages, only last 7 days per region
      const result: Record<
        string,
        { date: string; avgResponseTime: number }[]
      > = {};
      Object.entries(grouped).forEach(([region, days]) => {
        const sortedDays = Object.keys(days).sort();
        const last7Days = sortedDays.slice(-7);
        result[region] = last7Days.map((day) => {
          const checks = days[day];
          const avgResponseTime =
            checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length;
          return { date: day, avgResponseTime };
        });
      });

      return result;
    } catch (error) {
      console.error("Error getting daily aggregates:", error);
      throw error;
    }
  }
}

export default new MonitoringService();
