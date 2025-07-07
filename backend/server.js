import youtubeRouter from './youtube.js';
import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { db, admin } from "./firebase.js";
import cors from "cors";
import axios from "axios";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://studyhive-frontend-nu.vercel.app/",
  "https://studyhive-backend-j107.onrender.com",
];

console.log("Allowed origins:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;
  console.log(`Socket connection attempt from: ${origin}`);
  if (!origin || allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
    return next();
  }
  return next(new Error("Origin not allowed"));
});

const roomUsers = {};
const matchmakingQueue = [];

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id, "from", socket.handshake.headers.origin);

  // ===== Chat Room Join =====
  socket.on("joinRoom", async (roomId) => {
    console.log("🟢 joinRoom:", socket.id, "Room:", roomId);
    socket.join(roomId);
    try {
      const messagesSnapshot = await db.collection("chats").doc(roomId).collection("messages").orderBy("timestamp", "asc").get();
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      socket.emit("error", { message: "Failed to load messages" });
    }
  });

  // ===== Chat Message =====
  socket.on("message", async ({ roomId, user, text }) => {
    console.log("✉️ Message from:", socket.id, "Room:", roomId);
    try {
      const message = { user, text, timestamp: admin.firestore.FieldValue.serverTimestamp() };
      await db.collection("chats").doc(roomId).collection("messages").add(message);
      io.to(roomId).emit("message", message);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ===== Standalone Video Signaling =====
  socket.on("join-video-room", ({ roomId, userId }) => {
  socket.join(roomId);
  socket.userId = userId;

  if (!roomUsers[roomId]) roomUsers[roomId] = [];
  if (!roomUsers[roomId].includes(userId)) roomUsers[roomId].push(userId);

  io.to(roomId).emit("user-list", roomUsers[roomId]);
  socket.to(roomId).emit("user-joined", userId);

  // 👇 ADD THIS: Notify others to start handshake
  if (roomUsers[roomId].length > 1) {
    socket.to(roomId).emit("ready");
  }
});


  socket.on("offer", ({ to, offer, roomId }) => {
    if (to) {
      const targetSocket = [...io.sockets.sockets.values()].find((s) => s.userId === to);
      if (targetSocket) targetSocket.emit("offer", { from: socket.userId, offer });
    } else {
      socket.to(roomId).emit("offer", { offer });
    }
  });

  socket.on("answer", ({ to, answer, roomId }) => {
    if (to) {
      const targetSocket = [...io.sockets.sockets.values()].find((s) => s.userId === to);
      if (targetSocket) targetSocket.emit("answer", { from: socket.userId, answer });
    } else {
      socket.to(roomId).emit("answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate, roomId }) => {
    if (to) {
      const targetSocket = [...io.sockets.sockets.values()].find((s) => s.userId === to);
      if (targetSocket) targetSocket.emit("ice-candidate", { from: socket.userId, candidate });
    } else {
      socket.to(roomId).emit("ice-candidate", { candidate });
    }
  });

  // ===== Matchmaking =====
  socket.on('join-matchmaking-queue', async ({ userId, language, college, interest, year, location }) => {
    const newUser = { socketId: socket.id, userId, language, college, interest, year, location };
    const match = matchmakingQueue.find(user => (
      user.language === newUser.language ||
      user.college === newUser.college ||
      user.interest === newUser.interest ||
      user.year === newUser.year ||
      user.location === newUser.location
    ));

    if (match) {
      const groupId = `private-${Date.now()}`;
      await db.collection("studyGroups").doc(groupId).set({
        id: groupId,
        name: `Private Group: ${match.userId} & ${newUser.userId}`,
        members: [match.userId, newUser.userId],
        isPrivate: true,
        createdAt: new Date().toISOString()
      });
      io.to(socket.id).emit('matched', { groupId });
      io.to(match.socketId).emit('matched', { groupId });
      matchmakingQueue.splice(matchmakingQueue.indexOf(match), 1);
    } else {
      matchmakingQueue.push(newUser);
    }
  });

  socket.on('cancel-matchmaking', () => {
    const index = matchmakingQueue.findIndex(user => user.socketId === socket.id);
    if (index !== -1) matchmakingQueue.splice(index, 1);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id, "User:", socket.userId);
    for (const roomId in roomUsers) {
      if (roomUsers[roomId]?.includes(socket.userId)) {
        roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.userId);
        io.to(roomId).emit("user-list", roomUsers[roomId]);
        io.to(roomId).emit("user-left", socket.userId);
      }
    }
  });
});

// Route for checking server status
app.get("/healthcheck", (req, res) => {
  res.json({ status: "ok", message: "Server is running", env: process.env.NODE_ENV });
});

// Create Study Group
app.post("/create-group", async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    const newGroup = await db.collection("studyGroups").add({
      name,
      createdBy,
      members: [createdBy],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ id: newGroup.id, name, createdBy });
  } catch (error) {
    console.error("❌ Error creating study group:", error);
    res.status(500).json({ error: "Failed to create study group" });
  }
});

// Join Study Group
app.post("/join-group", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    await db.collection("studyGroups").doc(groupId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });
    res.json({ message: "✅ Joined group successfully" });
  } catch (error) {
    console.error("❌ Error joining study group:", error);
    res.status(500).json({ error: "Failed to join study group" });
  }
});

// Get Study Groups
app.get("/study-groups", async (req, res) => {
  try {
    const snapshot = await db.collection("studyGroups").orderBy("createdAt", "desc").get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(groups);
  } catch (error) {
    console.error("❌ Error retrieving study groups:", error);
    res.status(500).json({ error: "Failed to retrieve study groups" });
  }
});

// Study Plan APIs
app.post("/study-plan", async (req, res) => {
  try {
    const { userId, task } = req.body;
    await db.collection("studyPlans").doc(userId).collection("tasks").add({
      task,
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "✅ Task added" });
  } catch (error) {
    console.error("❌ Error adding study plan task:", error);
    res.status(500).json({ error: "Failed to create study plan task" });
  }
});

app.get("/study-plan/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasksSnapshot = await db.collection("studyPlans").doc(userId).collection("tasks").orderBy("createdAt", "desc").get();
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error retrieving study plan tasks:", error);
    res.status(500).json({ error: "Failed to retrieve study plan tasks" });
  }
});

app.put("/study-plan/:userId/:taskId", async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    await db.collection("studyPlans").doc(userId).collection("tasks").doc(taskId).update({
      completed: true,
    });
    res.json({ message: "✅ Task completed" });
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// User Profile APIs
app.post("/user-profile", async (req, res) => {
  try {
    const { userId, name, email, interests, college, year } = req.body;
    await db.collection("users").doc(userId).set({
      name,
      email,
      interests,
      college,
      year,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "✅ Profile created successfully" });
  } catch (error) {
    console.error("❌ Error creating user profile:", error);
    res.status(500).json({ error: "Failed to create user profile" });
  }
});

app.get("/user-profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (userDoc.exists) {
      res.json({ id: userDoc.id, ...userDoc.data() });
    } else {
      res.status(404).json({ error: "User profile not found" });
    }
  } catch (error) {
    console.error("❌ Error retrieving user profile:", error);
    res.status(500).json({ error: "Failed to retrieve user profile" });
  }
});

app.put("/user-profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove any undefined or null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });
    
    await db.collection("users").doc(userId).update(updateData);
    res.json({ message: "✅ Profile updated successfully" });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});


// Notification APIs
app.post("/notifications", async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    await db.collection("notifications").add({
      userId,
      message,
      type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "✅ Notification sent" });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

app.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notificationsSnapshot = await db.collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (error) {
    console.error("❌ Error retrieving notifications:", error);
    res.status(500).json({ error: "Failed to retrieve notifications" });
  }
});

app.put("/notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    await db.collection("notifications").doc(notificationId).update({
      read: true,
    });
    res.json({ message: "✅ Notification marked as read" });
  } catch (error) {
    console.error("❌ Error updating notification status:", error);
    res.status(500).json({ error: "Failed to update notification status" });
  }
});

// Youtube Routes
app.use('/api/youtube', youtubeRouter);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
