import admin from "firebase-admin";
import { StatusCheck } from "../types";
import dotenv from "dotenv";

dotenv.config();

class FirebaseService {
  private db: admin.firestore.Firestore;
  private processId: string;

  constructor() {
    // Generate unique process ID for this instance
    this.processId = `${
      process.env.NODE_ENV || "dev"
    }_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  // Acquire distributed lock for monitoring operations
  async acquireMonitoringLock(): Promise<boolean> {
    const lockDoc = this.db.collection("system-locks").doc("monitoring-cycle");
    const lockData = {
      timestamp: admin.firestore.Timestamp.now(),
      processId: this.processId,
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 10 * 60 * 1000)
      ), // 10 min expiry
    };

    try {
      // Try to create lock document (fails if already exists)
      await lockDoc.create(lockData);
      console.log(`Monitoring lock acquired by process: ${this.processId}`);
      return true;
    } catch (error: any) {
      if (error.code === "already-exists") {
        // Check if existing lock has expired
        const existingLock = await lockDoc.get();
        if (existingLock.exists) {
          const lockInfo = existingLock.data();
          const now = admin.firestore.Timestamp.now();

          if (
            lockInfo?.expiresAt &&
            lockInfo.expiresAt.toMillis() < now.toMillis()
          ) {
            // Lock has expired, try to take over
            try {
              await lockDoc.set(lockData, { merge: false });
              console.log(
                `Monitoring lock acquired (expired lock taken over) by process: ${this.processId}`
              );
              return true;
            } catch (takeoverError) {
              console.log(`Another process beat us to the expired lock`);
              return false;
            }
          }
        }
        console.log(
          `Monitoring lock held by another process (lock holder: ${
            existingLock.data()?.processId || "unknown"
          })`
        );
        return false;
      }
      throw error;
    }
  }

  // Release distributed lock
  async releaseMonitoringLock(): Promise<void> {
    const lockDoc = this.db.collection("system-locks").doc("monitoring-cycle");

    try {
      const lockSnapshot = await lockDoc.get();
      if (
        lockSnapshot.exists &&
        lockSnapshot.data()?.processId === this.processId
      ) {
        await lockDoc.delete();
        console.log(`Monitoring lock released by process: ${this.processId}`);
      }
    } catch (error) {
      console.error("Error releasing monitoring lock:", error);
      // Don't throw - we don't want to fail the monitoring cycle just because we couldn't release the lock
    }
  }

  // writing to database with deterministic IDs to prevent duplicates
  async saveStatusCheck(statusCheck: StatusCheck): Promise<void> {
    try {
      // Create deterministic document ID: region_hourBucket
      // This ensures only one document per region per hour
      const hourBucket = Math.floor(
        statusCheck.timestamp.getTime() / (60 * 60 * 1000)
      );
      const docId = `${statusCheck.region}_${hourBucket}`;

      const cleanStatusCheck = {
        ...statusCheck,
        timestamp: admin.firestore.Timestamp.fromDate(statusCheck.timestamp),
        stats: statusCheck.stats ? JSON.stringify(statusCheck.stats) : null,
        processId: this.processId, // Track which process created this record
        hourBucket, // Add for easier querying
      };

      // Use set with merge to handle potential race conditions gracefully
      await this.db
        .collection("status-checks")
        .doc(docId)
        .set(cleanStatusCheck, { merge: false });
      console.log(
        `Saved status check for ${statusCheck.region} (doc: ${docId})`
      );
    } catch (error: any) {
      if (error.code === "already-exists") {
        console.log(
          `Status check for ${statusCheck.region} already exists for this hour - skipping duplicate`
        );
        return; // Not an error - just a duplicate we're preventing
      }
      console.error("Error saving status check:", error);
      throw error;
    }
  }

  // Batch save all status checks for a monitoring cycle
  async saveStatusChecks(statusChecks: StatusCheck[]): Promise<void> {
    if (statusChecks.length === 0) {
      return;
    }

    try {
      const batch = this.db.batch();

      for (const statusCheck of statusChecks) {
        const hourBucket = Math.floor(
          statusCheck.timestamp.getTime() / (60 * 60 * 1000)
        );
        const docId = `${statusCheck.region}_${hourBucket}`;

        const cleanStatusCheck = {
          ...statusCheck,
          timestamp: admin.firestore.Timestamp.fromDate(statusCheck.timestamp),
          stats: statusCheck.stats ? JSON.stringify(statusCheck.stats) : null,
          processId: this.processId,
          hourBucket,
        };

        const docRef = this.db.collection("status-checks").doc(docId);
        batch.set(docRef, cleanStatusCheck, { merge: false });
      }

      await batch.commit();
      console.log(`Batch saved ${statusChecks.length} status checks`);
    } catch (error) {
      console.error("Error batch saving status checks:", error);
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

  // deletes data from database (for the cleanup function)
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

      // Process in batches of 500 (Firestore batch limit)
      const batchSize = 500;
      const totalDocs = snapshot.size;
      let processedDocs = 0;

      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = this.db.batch();
        const batchDocs = snapshot.docs.slice(i, i + batchSize);

        batchDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        processedDocs += batchDocs.length;
        console.log(
          `Cleanup progress: ${processedDocs}/${totalDocs} documents deleted`
        );
      }

      console.log(`Cleaned up ${totalDocs} old records`);
    } catch (error) {
      console.error("Error cleaning up old data:", error);
      throw error;
    }
  }

  // Clean up expired locks (call this periodically)
  async cleanupExpiredLocks(): Promise<void> {
    try {
      const now = admin.firestore.Timestamp.now();
      const expiredLocks = await this.db
        .collection("system-locks")
        .where("expiresAt", "<", now)
        .get();

      if (!expiredLocks.empty) {
        const batch = this.db.batch();
        expiredLocks.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${expiredLocks.size} expired locks`);
      }
    } catch (error) {
      console.error("Error cleaning up expired locks:", error);
    }
  }
}

export default new FirebaseService();
