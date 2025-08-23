import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { Timestamp } from "firebase-admin/firestore";

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_KEY;
if (!serviceAccountPath) throw new Error("FIREBASE_KEY not set");

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(serviceAccountPath), "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

/**
 * Fully sanitize an object for Firestore
 */
function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return Timestamp.fromDate(obj);
  if (obj instanceof Timestamp) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        value !== undefined &&
        typeof value !== "function" &&
        !Number.isNaN(value) &&
        Number.isFinite(value)
      ) {
        result[key] = sanitize(value);
      }
    }
    return result;
  }
  return obj;
}

// Store endpoint safely
export async function storeEndpointData(url: string, data: any) {
  try {
    const sanitized = {
      url,
      data: sanitize(data),
      timestamp: Timestamp.now(),
    };
    await db.collection("endpointData").add(sanitized);
  } catch (err) {
    console.error("Failed to store endpoint data:", err);
  }
}

// Get historical data
export async function getHistoricalData(days = 7) {
  const since = Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );

  // Firestore requires an index for .where + .orderBy on timestamp
  const snapshot = await db
    .collection("endpointData")
    .where("timestamp", ">=", since)
    .orderBy("timestamp", "asc") // Make sure to create index in Firebase Console
    .get();

  return snapshot.docs.map((doc) => doc.data());
}

// Get latest for a URL
export async function getLatestData(url: string) {
  // Firestore requires an index for .where + .orderBy on timestamp
  const snapshot = await db
    .collection("endpointData")
    .where("url", "==", url)
    .orderBy("timestamp", "desc") // Create a composite index for url + timestamp
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}
