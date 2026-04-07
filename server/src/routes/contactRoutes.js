import express from "express";
import { addContact, getContacts, replaceContacts } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", addContact);
router.put("/:userId", replaceContacts);
router.get("/:userId", getContacts);

export default router;
