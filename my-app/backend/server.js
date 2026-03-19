const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

admin.initializeApp({
  projectId: "taskly-app-vdev"
});

app.post("/auth/login", async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email.split("@")[0],
    };

    res.json({ success: true, user });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ success: false, error: "Invalid token" });
  }
});

// Database Persistence
const tasksFilePath = path.join(__dirname, 'tasks.json');
let globalTasks = [];

if (fs.existsSync(tasksFilePath)) {
  try {
    const data = fs.readFileSync(tasksFilePath, 'utf8');
    globalTasks = JSON.parse(data);
  } catch (err) {
    console.error("Error reading tasks database:", err);
  }
}

const saveTasks = () => {
  try {
    fs.writeFileSync(tasksFilePath, JSON.stringify(globalTasks, null, 2));
  } catch (err) {
    console.error("Error saving tasks recursively:", err);
  }
};

app.get("/dashboard", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userEmail = decoded.email;

    const user = {
      name: decoded.name || decoded.email.split("@")[0],
      email: decoded.email,
    };

    // Show tasks either assigned to this user or created by this user
    const userTasks = globalTasks.filter(t => t.assignee === userEmail || t.creator === userEmail);

    res.json({ success: true, user, tasks: userTasks });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(401).json({ success: false });
  }
});

app.post("/dashboard/task", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userEmail = decoded.email;
    const { title, description, assignee, deadline, category } = req.body;
    
    // Auto-assign to self if empty
    const finalAssignee = assignee && assignee.trim() !== "" ? assignee : userEmail;

    // Convert deadline and check urgency
    let dateStr = "No Date";
    let priority = "Normal";

    if (deadline) {
      const d = new Date(deadline);
      const now = new Date();
      // Calculate diff in days
      const diffTime = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 5) {
        priority = "Urgent";
      }

      dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const newTask = {
      id: Date.now().toString(),
      title: title || "New Task",
      description: description || "No description provided.",
      status: finalAssignee !== userEmail ? "PENDING" : "ACCEPTED",
      priority: priority, // fallback
      category: category || "General",
      dueDate: dateStr,
      rawDeadline: deadline || null,
      assignee: finalAssignee,
      creator: userEmail
    };

    globalTasks.push(newTask);
    saveTasks(); // Persist to database
    res.json({ success: true, task: newTask });
  } catch (err) {
    console.error("Task creation error:", err);
    res.status(401).json({ success: false });
  }
});

app.put("/dashboard/task/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const taskId = req.params.id;
    const { status } = req.body;
    
    // Allow updating tasks regardless of user for simplicity in this demo,
    // but in a real app, verify `decoded.email === task.assignee`.
    const taskIndex = globalTasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      const oldStatus = globalTasks[taskIndex].status;
      globalTasks[taskIndex].status = status;
      
      if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
        globalTasks[taskIndex].completedAt = new Date().toISOString();
      } else if (status !== "COMPLETED") {
        globalTasks[taskIndex].completedAt = null;
      }

      saveTasks(); // Persist to database
      res.json({ success: true, task: globalTasks[taskIndex] });
    } else {
      res.status(404).json({ success: false, message: "Task not found" });
    }
  } catch (err) {
    console.error("Task update error:", err);
    res.status(401).json({ success: false });
  }
});

app.delete("/dashboard/task/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userEmail = decoded.email;
    const taskId = req.params.id;

    const taskIndex = globalTasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      const task = globalTasks[taskIndex];
      // Allow deletion if assigned to user or created by user AND marked as completed
      if ((task.assignee === userEmail || task.creator === userEmail) && task.status === "COMPLETED") {
        globalTasks.splice(taskIndex, 1);
        saveTasks(); // Persist to database
        res.json({ success: true, message: "Task deleted" });
      } else {
        res.status(403).json({ success: false, message: "Unauthorized or not completed" });
      }
    } else {
      res.status(404).json({ success: false, message: "Task not found" });
    }
  } catch (err) {
    console.error("Task deletion error:", err);
    res.status(401).json({ success: false });
  }
});

app.listen(5001, () => console.log("Server running on port 5001"));