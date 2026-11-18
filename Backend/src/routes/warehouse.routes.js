import express from "express";
import {
    createWarehouse,
    deleteWarehouse,
    getWarehouses,
    updateWarehouse
} from "../controllers/warehouse.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("admin", "salesRepresentative", "warehouseManager"), getWarehouses);
router.post("/", authenticateToken, authorizeRoles("admin"), createWarehouse);
router.put("/:id", authenticateToken, authorizeRoles("admin"), updateWarehouse);
router.delete("/:id", authenticateToken, authorizeRoles("admin"), deleteWarehouse);

export default router;
