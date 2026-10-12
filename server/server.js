
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

app.get("/", (req, res) => {
  res.send("Real-Time Chat Server is running!");
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (username) => {
    socket.data.username = String(username || "Guest").slice(0, 30);
    onlineUsers.set(socket.id, socket.data.username);

    io.emit("users", Array.from(onlineUsers.values()));
    io.emit("systemMessage", `${socket.data.username} joined the chat`);
  });

  socket.on("chatMessage", (message) => {
    const text = String(message || "").trim().slice(0, 1000);
    if (!text || !socket.data.username) return;

    io.emit("chatMessage", {
      id: `${Date.now()}-${socket.id}`,
      username: socket.data.username,
      text,
      time: new Date().toLocaleTimeString(),
    });
  });

  socket.on("disconnect", () => {
    const username = onlineUsers.get(socket.id);

    if (username) {
      onlineUsers.delete(socket.id);
      io.emit("users", Array.from(onlineUsers.values()));
      io.emit("systemMessage", `${username} left the chat`);
    }

    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});
