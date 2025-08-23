import { db } from "./firestore";

export async function cleanupOldData() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const snapshot = await db
    .collection("endpointData")
    .where("timestamp", "<", oneWeekAgo)
    .get();

  snapshot.forEach((doc) => doc.ref.delete());
  console.log(`Cleaned up ${snapshot.size} old documents`);
}
