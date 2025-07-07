import admin from "firebase-admin";
import fs from "fs";

// Read service account key
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Create Firestore database instance
const db = admin.firestore();

// Export db and admin
export { db, admin };
