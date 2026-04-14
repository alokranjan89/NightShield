import express from "express";
import {
  createSOS,
  getSOSHistory,
  resolveSOS,
  uploadSOSEvidence,
} from "../controllers/sosController.js";
import {
  requireAuthenticatedUser,
  requireMatchingBodyUserId,
  requireMatchingParamUserId,
} from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", requireAuthenticatedUser, requireMatchingBodyUserId, createSOS);
router.get("/history/:userId", requireAuthenticatedUser, requireMatchingParamUserId, getSOSHistory);
router.patch("/:id/resolve", requireAuthenticatedUser, resolveSOS);
router.post("/evidence", requireAuthenticatedUser, upload.single("file"), requireMatchingBodyUserId, uploadSOSEvidence);

export default router;
