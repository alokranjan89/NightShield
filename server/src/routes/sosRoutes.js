import express from "express";
import {
  createSOS,
  getSOSHistory,
  resolveSOS,
  uploadSOSEvidence,
} from "../controllers/sosController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", createSOS);
router.get("/history/:userId", getSOSHistory);
router.patch("/:id/resolve", resolveSOS);
router.post("/evidence", upload.single("file"), uploadSOSEvidence);

export default router;
