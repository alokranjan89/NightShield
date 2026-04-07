import express from "express";
import { updateLocation } from "../controllers/userController.js";

const router = express.Router();

router.post("/location", updateLocation);

export default router;