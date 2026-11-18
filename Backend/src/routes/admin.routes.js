import express from "express";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js";
import {
    getAllUsers,
    addDoctor,
    deleteUser,
    toggleUserActive,
    getAllAppointments,
    getStats
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get("/users", getAllUsers);
router.post("/doctors", addDoctor);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/toggle", toggleUserActive);
router.get("/appointments", getAllAppointments);
router.get("/stats", getStats);

export default router;