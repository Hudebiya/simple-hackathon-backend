import express from "express";
import { createUser, deleteUser, getUsers, updateUser } from "../controllers/users.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("admin"), getUsers);
router.post("/", authenticateToken, authorizeRoles("admin"), createUser);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, authorizeRoles("admin"), deleteUser);

export default router;
