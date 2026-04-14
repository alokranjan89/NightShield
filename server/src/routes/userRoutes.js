import express from "express";
import { updateLocation } from "../controllers/userController.js";
import {
  requireAuthenticatedUser,
  requireMatchingBodyUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/location", requireAuthenticatedUser, requireMatchingBodyUserId, updateLocation);

export default router;
