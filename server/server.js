import "./src/config/env.js";
import app from "./src/app.js";
import { verifyToken } from "@clerk/backend";
import connectDB from "./src/config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { buildAllowedOrigins, isAllowedOrigin } from "./src/config/origin.js";
import { registerUserSocket, setIO, unregisterSocket } from "./src/socketStore.js";

const PORT = process.env.PORT || 5000;
const allowedOrigins = buildAllowedOrigins();

// create HTTP server
const server = createServer(app);

// create socket server
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        return callback(null, true);
      }

      return callback(new Error("Socket.IO CORS origin not allowed"));
    },
    credentials: true,
  },
});

setIO(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized socket connection"));
    }

    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const userId = verifiedToken.data?.sub;

    if (!userId) {
      return next(new Error("Unauthorized socket connection"));
    }

    socket.data.userId = userId;
    return next();
  } catch {
    return next(new Error("Unauthorized socket connection"));
  }
});

// socket connection
io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log("User connected:", userId, socket.id);
  registerUserSocket(userId, socket.id);
  console.log("Registered:", userId, socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    unregisterSocket(socket.id);
  });
});

connectDB();

// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
