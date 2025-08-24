import admin from "firebase-admin";
import { StatusCheck } from "../types";
import dotenv from "dotenv";

dotenv.config();

class FirebaseService {
  private db: admin.firestore.Firestore;

  constructor() {
    // firebase admin SDK
    if (!admin.apps.length) {
      // environment variables check
      if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
      ) {
        throw new Error(
          "Firebase environment variables are not set (.env file error)."
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    this.db = admin.firestore();
  }

  // writing to database
  async saveStatusCheck(statusCheck: StatusCheck): Promise<void> {
    try {
      const cleanStatusCheck = {
        ...statusCheck,
        timestamp: admin.firestore.Timestamp.fromDate(statusCheck.timestamp),
        stats: statusCheck.stats ? JSON.stringify(statusCheck.stats) : null,
      };

      await this.db.collection("status-checks").add(cleanStatusCheck);
      console.log(`Saved status check for ${statusCheck.region}`);
    } catch (error) {
      console.error("Error saving status check:", error);
      throw error;
    }
  }

  // reading from database (for historical data use)
  async getRecentChecks(
    region?: string,
    hours: number = 24
  ): Promise<StatusCheck[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      let query = this.db
        .collection("status-checks")
        .where(
          "timestamp",
          ">=",
          admin.firestore.Timestamp.fromDate(cutoffTime)
        )
        .orderBy("timestamp", "desc");

      if (region) {
        query = query.where("region", "==", region);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate(),
          stats:
            data.stats && typeof data.stats === "string"
              ? JSON.parse(data.stats)
              : data.stats,
        } as StatusCheck;
      });
    } catch (error) {
      console.error("Error fetching recent checks:", error);
      throw error;
    }
  }

  // deletes data from database (for the cleanup funciton)
  async cleanupOldData(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const query = this.db
        .collection("status-checks")
        .where(
          "timestamp",
          "<",
          admin.firestore.Timestamp.fromDate(oneWeekAgo)
        );

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log("No old data to cleanup");
        return;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} old records`);
    } catch (error) {
      console.error("Error cleaning up old data:", error);
    }
  }
}

export default new FirebaseService();
