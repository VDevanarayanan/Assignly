const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
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

let globalTasks = [
  { 
    title: "Q4 Brand Guidelines Review", 
    description: "Review the final version of the brand guidelines and provide feedback to the design team before EOD.", 
    status: "ACCEPTED", priority: "Urgent", category: "Design", dueDate: "Oct 24, 2023" 
  },
  { 
    title: "Mobile App Sprint Planning", 
    description: "Outline the main objectives for the upcoming two-week mobile development sprint.", 
    status: "IN PROGRESS", priority: "Normal", category: "Product", dueDate: "Oct 26, 2023" 
  },
  { 
    title: "Investor Presentation Prep", 
    description: "Consolidate quarterly data into the new slide deck template for the board meeting.", 
    status: "ACCEPTED", priority: "High", category: "Strategy", dueDate: "Oct 30, 2023" 
  }
];

app.get("/dashboard", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const user = {
      name: decoded.name || decoded.email.split("@")[0],
      email: decoded.email,
    };

    res.json({ success: true, user, tasks: globalTasks });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(401).json({ success: false });
  }
});

app.post("/dashboard/task", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { title, description, assignee, deadline } = req.body;
    
    // Convert deadline to a readable format if provided
    let dateStr = "No Date";
    if (deadline) {
      const d = new Date(deadline);
      dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const newTask = {
      title: title || "New Task",
      description: description || "No description provided.",
      status: "IN PROGRESS",
      priority: "Normal",
      category: "General",
      dueDate: dateStr,
      assignee: assignee || "Unassigned"
    };

    globalTasks.push(newTask);

    res.json({ success: true, task: newTask });
  } catch (err) {
    console.error("Task creation error:", err);
    res.status(401).json({ success: false });
  }
});

app.listen(5001, () => console.log("Server running on port 5001"));