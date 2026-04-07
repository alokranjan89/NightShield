import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { setIO, users } from "./src/socketStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// create HTTP server
const server = createServer(app);

// create socket server
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Socket.IO CORS origin not allowed"));
    },
    credentials: true,
  },
});

setIO(io);

// socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // register user
  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log("Registered:", userId, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // remove user
    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
      }
    }
  });
});

connectDB();

// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
