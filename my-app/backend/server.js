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

app.get("/dashboard", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const user = {
      name: decoded.name || decoded.email.split("@")[0],
      email: decoded.email,
    };

    const tasks = [
      { title: "Task 1", description: "Complete UI", status: "Pending" },
      { title: "Task 2", description: "Connect backend", status: "Done" },
    ];

    res.json({ success: true, user, tasks });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(401).json({ success: false });
  }
});

app.listen(5001, () => console.log("Server running on port 5001"));