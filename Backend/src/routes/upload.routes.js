import express from "express";
import { getUploadAuthentication } from "../controllers/upload.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/auth", authenticateToken, getUploadAuthentication);

export default router;
