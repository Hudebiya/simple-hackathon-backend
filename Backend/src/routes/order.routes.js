import express from "express";
import {
    cancelOrder,
    createOrder,
    getOrder,
    getOrders,
    updateOrderStatus
} from "../controllers/order.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();
const orderReaders = authorizeRoles("admin", "warehouseManager", "salesRepresentative");

router.post("/", authenticateToken, authorizeRoles("salesRepresentative"), createOrder);
router.get("/", authenticateToken, orderReaders, getOrders);
router.get("/:id", authenticateToken, orderReaders, getOrder);
router.put("/:id/status", authenticateToken, authorizeRoles("admin", "warehouseManager"), updateOrderStatus);
router.put("/:id/cancel", authenticateToken, authorizeRoles("admin", "salesRepresentative"), cancelOrder);

export default router;
