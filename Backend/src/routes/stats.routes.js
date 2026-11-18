import express from "express";
import { getStats } from "../controllers/stats.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("admin"), getStats);

export default router;
