import express from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    createAppointment,
    getMyAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    cancelAppointment
} from "../controllers/appointment.controller.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("patient"), createAppointment);
router.get("/my", authenticateToken, authorizeRoles("patient"), getMyAppointments);
router.get("/doctor", authenticateToken, authorizeRoles("doctor"), getDoctorAppointments);
router.patch("/:id/status", authenticateToken, authorizeRoles("doctor"), updateAppointmentStatus);
router.patch("/:id/cancel", authenticateToken, authorizeRoles("patient"), cancelAppointment);

export default router;