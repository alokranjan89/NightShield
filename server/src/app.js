import express from "express";
import cors from "cors";
import sosRoutes from "./routes/sosRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/sos", sosRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend is working" });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true });
});

export default app;
