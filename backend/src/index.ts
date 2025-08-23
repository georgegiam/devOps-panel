import { fetchAndStore } from "./scheduler";
import { cleanupOldData } from "./cleanup";
import { broadcastLatestData } from "./websocket";

console.log("Starting endpoint monitor backend...");

// Fetch & broadcast data every minute
setInterval(async () => {
  try {
    await fetchAndStore();
    await broadcastLatestData();
  } catch (err) {
    console.error("Error in fetch/broadcast loop:", err);
  }
}, 60 * 1000);

// Cleanup old data every hour
setInterval(async () => {
  try {
    await cleanupOldData();
  } catch (err) {
    console.error("Error in cleanup loop:", err);
  }
}, 60 * 60 * 1000);

// Optional: initial run
(async () => {
  try {
    await fetchAndStore();
    await broadcastLatestData();
  } catch (err) {
    console.error("Error in initial run:", err);
  }
})();
