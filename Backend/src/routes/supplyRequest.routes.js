import express from "express";
import {
    createSupplyRequest,
    getSupplyRequests,
    getSupplyRequestWarehouses,
    updateSupplyRequestStatus
} from "../controllers/supplyRequest.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("supplier"), createSupplyRequest);
router.get("/", authenticateToken, authorizeRoles("supplier", "admin", "warehouseManager"), getSupplyRequests);
router.get("/warehouses", authenticateToken, authorizeRoles("supplier"), getSupplyRequestWarehouses);
router.put("/:id/status", authenticateToken, authorizeRoles("admin", "warehouseManager"), updateSupplyRequestStatus);

export default router;
