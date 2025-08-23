import axios from "axios";
import { storeEndpointData } from "./firestore";

export const endpoints = [
  "https://data--us-east.upscope.io/status?stats=1",
  "https://data--eu-west.upscope.io/status?stats=1",
  "https://data--eu-central.upscope.io/status?stats=1",
  "https://data--us-west.upscope.io/status?stats=1",
  "https://data--sa-east.upscope.io/status?stats=1",
  "https://data--ap-southeast.upscope.io/status?stats=1",
];

export async function fetchAndStore() {
  for (const url of endpoints) {
    try {
      const res = await axios.get(url);

      // Ensure only JSON-serializable data is stored
      const safeData = JSON.parse(JSON.stringify(res.data));

      await storeEndpointData(url, safeData);
      console.log(`Stored data for ${url}`);
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
    }
  }
}
