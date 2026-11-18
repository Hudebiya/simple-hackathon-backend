import express from "express";
import { getTransactions } from "../controllers/stock.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("admin", "warehouseManager"), getTransactions);

export default router;
