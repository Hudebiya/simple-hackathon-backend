import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import userModel from "../models/users.model.js";

export async function authenticateToken(req, res, next) {
    const authorization = req.get("Authorization");
    const bearerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    const token = bearerToken || req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
    if (!mongoose.Types.ObjectId.isValid(payload.id)) {
        return res.status(401).json({ message: "Invalid token" });
    }

    try {
        const user = await userModel.findById(payload.id).select("role assignedWarehouses");
        if (!user) {
            return res.status(401).json({ message: "User session is no longer valid" });
        }

        req.user = {
            id: user._id.toString(),
            role: user.role,
            assignedWarehouses: user.assignedWarehouses
        };
        return next();
    } catch (error) {
        return next(error);
    }
}

export function authorizeRoles(...roles) {
    return function (req, res, next) {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        return next();
    };
}

export const requireAdmin = authorizeRoles("admin");
