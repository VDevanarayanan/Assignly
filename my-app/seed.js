import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

// Automatically load your local environment variables
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}

try {
  let serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (serviceAccountKey && serviceAccountKey.startsWith('"') && serviceAccountKey.endsWith('"')) {
    serviceAccountKey = serviceAccountKey.slice(1, -1);
  }

  if (!serviceAccountKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in your .env.local file.");
  }

  // Initialize Firebase Admin just like the Express backend
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "worksync-4bf52",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: serviceAccountKey,
    })
  });

  const db = admin.firestore();

  const seedData = async () => {
    console.log("🌱 Injecting Seed Data into Firestore...");
    
    // Replace these emails with your actual Google Auth emails if you want to see them in your dashboard natively
    const delegatorEmail = "manager@assignly.com";
    const assigneeEmail = "employee@assignly.com";

    // Create 3 dummy tasks covering the various dashboard states (Pending, In Progress, Completed)
    const mockTasks = [
      {
        id: Date.now().toString() + "_1",
        title: "Design Client Presentation",
        description: "Create the slide deck for the Q4 roadmap review.",
        assignee: assigneeEmail,
        category: "Design",
        priority: "Urgent", // Since it's urgent, it forces the dashboard highlight card
        status: "PENDING",
        createdBy: delegatorEmail,
        dueDate: new Date(Date.now() + 86400000).toISOString() // Due tomorrow
      },
      {
        id: Date.now().toString() + "_2",
        title: "Refactor Database Schema",
        description: "Migrate the SQL tables to the new NoSQL Firestore structure.",
        assignee: assigneeEmail,
        category: "Engineering",
        priority: "Normal",
        status: "IN_PROGRESS",
        createdBy: delegatorEmail,
      },
      {
        id: Date.now().toString() + "_3",
        title: "Audit Q3 Expenses",
        description: "Compile and audit the financial expense reports from Q3.",
        assignee: delegatorEmail, // Self-assigned
        category: "Finance",
        priority: "High",
        status: "COMPLETED",
        createdBy: delegatorEmail,
        completedAt: new Date().toISOString() // Should immediately ping "Completed This Week" counter
      }
    ];

    const batch = db.batch();
    
    mockTasks.forEach((task) => {
      task.createdAt = new Date().toISOString();
      task.rawDeadline = task.dueDate || "";
      const docRef = db.collection('tasks').doc(task.id);
      batch.set(docRef, task);
    });

    await batch.commit();
    console.log("✅ Successfully injected 3 mock tasks into the Assignly Database!");
    process.exit(0);
  };

  seedData();

} catch (err) {
  console.error("❌ CRITICAL: Failed to seed data. Make sure .env.local exists.", err);
  process.exit(1);
}
