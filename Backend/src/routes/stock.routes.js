import express from "express";
import { getLowStock, getStock, stockIn, stockOut } from "../controllers/stock.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();
const inventoryRoles = ["admin", "warehouseManager"];

router.post("/in", authenticateToken, authorizeRoles(...inventoryRoles), stockIn);
router.post("/out", authenticateToken, authorizeRoles(...inventoryRoles), stockOut);
router.get("/", authenticateToken, authorizeRoles("admin", "warehouseManager", "salesRepresentative"), getStock);
router.get("/low", authenticateToken, authorizeRoles(...inventoryRoles), getLowStock);

export default router;
