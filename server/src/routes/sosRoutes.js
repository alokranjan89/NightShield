import express from "express";
import { createSOS } from "../controllers/sosController.js";

const router = express.Router();

router.post("/", createSOS);

export default router;