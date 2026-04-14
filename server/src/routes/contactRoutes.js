import express from "express";
import { addContact, getContacts, replaceContacts } from "../controllers/contactController.js";
import {
  requireAuthenticatedUser,
  requireMatchingBodyUserId,
  requireMatchingParamUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuthenticatedUser, requireMatchingBodyUserId, addContact);
router.put("/:userId", requireAuthenticatedUser, requireMatchingParamUserId, replaceContacts);
router.get("/:userId", requireAuthenticatedUser, requireMatchingParamUserId, getContacts);

export default router;
