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

  // checking given endpoint
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

  // checks all the given endpoints
  async checkAllEndpoints(): Promise<StatusCheck[]> {
    console.log(`\nStarting monitoring cycle at ${new Date().toISOString()}`);

    try {
      // paraller checking of endpoints for faster execution
      const promises = REGIONS.map((region) => this.checkEndpoint(region));
      const results = await Promise.all(promises);

      // save all results to database
      await Promise.all(
        results.map((result) => FirebaseService.saveStatusCheck(result))
      );

      // broadcast real time updates to connected clients
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

  // getting health summary for the last hour
  async getHealthSummary() {
    try {
      const recentChecks = await FirebaseService.getRecentChecks(undefined, 1);

      const summary = REGIONS.map((region) => {
        const regionChecks = recentChecks.filter(
          (check) => check.region === region.name
        );

        if (regionChecks.length === 0) {
          return {
            region: region.name,
            status: "unknown",
            lastCheck: null,
            responseTime: null,
          };
        }

        const latestCheck = regionChecks[0];

        return {
          region: region.name,
          status: latestCheck.isOnline ? "online" : "offline",
          lastCheck: latestCheck.timestamp,
          responseTime: latestCheck.responseTime,
          statusCode: latestCheck.statusCode,
        };
      });

      return summary;
    } catch (error) {
      console.error("Error getting health summary:", error);
      throw error;
    }
  }
}

export default new MonitoringService();
