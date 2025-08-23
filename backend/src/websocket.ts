import WebSocket from "ws";
import { getLatestData } from "./firestore";
import { endpoints } from "./scheduler";

export const wss = new WebSocket.Server({ port: 8080 });

// Broadcast latest data of all endpoints
export async function broadcastLatestData() {
  for (const url of endpoints) {
    try {
      const data = await getLatestData(url);
      if (!data) continue;

      const safePayload = JSON.stringify({ url, data }); // ensures valid JSON

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(safePayload);
        }
      });
    } catch (err) {
      console.error(`Failed to broadcast data for ${url}:`, err);
    }
  }
}

// Handle client connections
wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));
});
