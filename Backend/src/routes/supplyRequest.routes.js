import express from "express";
import {
    createSupplyRequest,
    getSupplyRequests,
    updateSupplyRequestStatus
} from "../controllers/supplyRequest.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("supplier"), createSupplyRequest);
router.get("/", authenticateToken, authorizeRoles("supplier", "admin", "warehouseManager"), getSupplyRequests);
router.put("/:id/status", authenticateToken, authorizeRoles("admin", "warehouseManager"), updateSupplyRequestStatus);

export default router;
