import express from "express";
import rateLimit from "express-rate-limit";
import {
  createSOS,
  getSOSHistory,
  resolveSOS,
  uploadSOSEvidence,
} from "../controllers/sosController.js";
import {
  allowGuestOrMatchingBodyUserId,
  optionalAuthenticatedUser,
  requireAuthenticatedUser,
  requireMatchingBodyUserId,
  requireMatchingParamUserId,
} from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
const sosCreateLimiter = rateLimit({
  windowMs: Number(process.env.SOS_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.SOS_RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", sosCreateLimiter, optionalAuthenticatedUser, allowGuestOrMatchingBodyUserId, createSOS);
router.get("/history/:userId", requireAuthenticatedUser, requireMatchingParamUserId, getSOSHistory);
router.patch("/:id/resolve", requireAuthenticatedUser, resolveSOS);
router.post("/evidence", requireAuthenticatedUser, upload.single("file"), requireMatchingBodyUserId, uploadSOSEvidence);

export default router;
