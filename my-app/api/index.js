import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let db;
let firebaseInitError = null;

try {
  if (!admin.apps.length) {
    let serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (serviceAccountKey && serviceAccountKey.startsWith('"') && serviceAccountKey.endsWith('"')) {
      serviceAccountKey = serviceAccountKey.slice(1, -1);
    }

    if (!serviceAccountKey || !process.env.FIREBASE_CLIENT_EMAIL) {
      firebaseInitError = "Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in Vercel Environment Variables.";
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "worksync-4bf52",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: serviceAccountKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || "worksync-4bf52",
      });
    }
  }
  
  if (!firebaseInitError) {
    db = admin.firestore();
  }
} catch (err) {
  firebaseInitError = err.message;
  console.error("CRITICAL: Failed to initialize Firebase Admin SDK", err);
}

// Middleware to intercept requests if Firebase is broken
app.use((req, res, next) => {
  if (firebaseInitError && req.path !== "/api/health") {
    return res.status(500).json({ 
      success: false, 
      error: "SERVERLESS_BOOT_CRASH", 
      message: firebaseInitError 
    });
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", firebaseDbMounted: !!db, initError: firebaseInitError });
});

app.post("/api/auth/login", async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    await db.collection('users').doc(decoded.email).set({
      email: decoded.email,
      uid: decoded.uid,
      name: decoded.name || decoded.email.split("@")[0],
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Auto-claim pending ghost tasks
    const pendingTasksSnapshot = await db.collection('tasks')
      .where('assignee', '==', decoded.email)
      .where('status', '==', 'PENDING_SIGNUP')
      .get();
      
    const batch = db.batch();
    pendingTasksSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        status: 'PENDING',
        joinedAt: new Date().toISOString()
      });
    });
    if (!pendingTasksSnapshot.empty) {
      await batch.commit();
    }

    res.json({ success: true, user: decoded });
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ success: false, message: "Invalid token: " + error.message });
  }
});

const verifyAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(403).json({ error: "Token expired or invalid" });
  }
};

  app.post("/api/dashboard/task", verifyAuth, async (req, res) => {
  try {
    const { title, description, assignee, deadline, dueDate, category, priority, status, forceCreate } = req.body;
    let finalStatus = status || "PENDING";
    let finalPriority = priority || "Normal";
    
    const rawDeadline = deadline || dueDate || "";
    if (rawDeadline) {
      const d = new Date(rawDeadline);
      if (!isNaN(d.getTime())) {
        const diffMs = d.getTime() - Date.now();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 3) {
          finalPriority = "Urgent";
        }
      }
    }
    
    if (assignee && assignee !== req.user.email) {
      const userDoc = await db.collection('users').doc(assignee).get();
      if (!userDoc.exists) {
        if (!forceCreate) {
          return res.status(404).json({ success: false, error: "USER_NOT_FOUND", message: "Assignee does not have an account." });
        }
        finalStatus = "PENDING_SIGNUP";
      }
    } else if (!assignee || assignee === req.user.email) {
      finalStatus = "ACCEPTED";
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description: description || "",
      assignee: assignee || req.user.email,
      dueDate: dueDate || deadline || "",
      rawDeadline: deadline || dueDate || "",
      category: category || "General",
      priority: finalPriority,
      status: finalStatus,
      createdBy: req.user.email,
      createdAt: new Date().toISOString(),
    };

    await db.collection('tasks').doc(newTask.id).set(newTask);
    res.json({ success: true, message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Task creation error:", error);
    res.status(500).json({ success: false, error: "Internal error: " + error.message, message: error.message });
  }
});

app.get("/api/dashboard", verifyAuth, async (req, res) => {
  try {
    const tasksSnapshot = await db.collection('tasks').get();
    const allTasks = [];
    tasksSnapshot.forEach(doc => allTasks.push(doc.data()));
    
    const relevantTasks = allTasks.filter((task) => {
      // Creator ALWAYS retains visibility of the task, ensuring it renders on their Delegated.jsx screen
      if (task.createdBy === req.user.email) return true;
      // Assignee only retains visibility if they haven't locally "deleted" (soft-deleted) the record from their Dashboard
      if (task.assignee === req.user.email && !task.deletedByAssignee) return true;
      return false;
    });
    res.json({
      success: true,
      user: { email: req.user.email, name: req.user.name || req.user.email.split('@')[0] },
      tasks: relevantTasks
    });
  } catch (error) {
    console.error("Dashboard endpoint error:", error);
    res.status(500).json({ success: false, error: "Internal error: " + error.message });
  }
});

app.put("/api/dashboard/task/:id", verifyAuth, async (req, res) => {
  try {
    const { status, clearJoinedAt, clearUnreadStatus } = req.body;
    const taskId = req.params.id;
    
    if (clearJoinedAt) {
      await db.collection('tasks').doc(taskId).update({
        joinedAt: admin.firestore.FieldValue.delete()
      });
      return res.json({ success: true, message: "Task joinedAt cleared" });
    }

    if (clearUnreadStatus) {
      await db.collection('tasks').doc(taskId).update({
        unreadStatusUpdate: admin.firestore.FieldValue.delete()
      });
      return res.json({ success: true, message: "Task unread status cleared" });
    }

    if (status) {
      const taskDoc = await db.collection('tasks').doc(taskId).get();
      if (!taskDoc.exists) return res.status(404).json({ error: "Not found" });
      const taskData = taskDoc.data();
      
      const updatePayload = { status, updatedAt: new Date().toISOString() };
      if (req.user.email !== taskData.createdBy) {
        updatePayload.unreadStatusUpdate = true;
      }
      
      if (status === "COMPLETED" && taskData.status !== "COMPLETED") {
        updatePayload.completedAt = new Date().toISOString();
      }
      
      await db.collection('tasks').doc(taskId).update(updatePayload);
      return res.json({ success: true, message: "Task updated" });
    }
    
    res.status(400).json({ success: false, error: "No valid action provided" });
  } catch (error) {
    console.error("PUT Error:", error);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

app.delete("/api/dashboard/task/:id", verifyAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    
    const taskData = taskDoc.data();

    // Soft Delete Implementation: 
    // If the active user is the assignee BUT NOT the creator, they cannot permanently erase the record from the global database.
    // Instead, they simply set a mask on the document that excludes it from their personal GET payload.
    if (req.user.email === taskData.assignee && req.user.email !== taskData.createdBy) {
      await db.collection('tasks').doc(taskId).update({ deletedByAssignee: true });
      return res.json({ success: true, message: "Task removed from your dashboard" });
    }
    
    // Otherwise, standard unrecoverable deletion for the owner
    await db.collection('tasks').doc(taskId).delete();
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

export default app;
