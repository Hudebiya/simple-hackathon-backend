import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { getDoctors, getDoctorById } from "../controllers/doctor.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getDoctors);
router.get("/:id", authenticateToken, getDoctorById);

export default router;