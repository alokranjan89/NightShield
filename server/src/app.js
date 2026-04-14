import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "./config/env.js";
import { buildAllowedOrigins, isAllowedOrigin } from "./config/origin.js";
import sosRoutes from "./routes/sosRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const allowedOrigins = buildAllowedOrigins();

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin, allowedOrigins)) {
        return callback(null, true);
      }

      if (origin.includes(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(clerkMiddleware());
app.use(apiLimiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api/sos", sosRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend is working" });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use((err, req, res, next) => {
  if (err?.message?.includes("CORS")) {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  return next(err);
});

export default app;