import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import userModel from "../models/users.model.js";
import { deleteImage, verifyImage } from "../utils/imagekit.js";

const roles = ["admin", "warehouseManager", "supplier", "salesRepresentative"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const selfEditableFields = ["name", "phone", "image", "imageFileId"];
const adminEditableFields = [
    ...selfEditableFields,
    "email",
    "password",
    "role",
    "assignedWarehouses"
];

function formatUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        image: user.image,
        imageFileId: user.imageFileId,
        assignedWarehouses: user.assignedWarehouses
    };
}

function isValidEmail(email) {
    return typeof email === "string" && emailPattern.test(email.trim());
}

export async function getUsers(req, res) {
    try {
        const filter = {};
        if (req.query.role !== undefined) {
            if (!roles.includes(req.query.role)) {
                return res.status(400).json({ message: "Invalid role filter." });
            }
            filter.role = req.query.role;
        }

        const users = await userModel.find(filter)
            .select("-password -googleId")
            .populate("assignedWarehouses", "name location")
            .sort({ _id: -1 });
        return res.status(200).json({
            message: "Users retrieved successfully.",
            users: users.map(formatUser)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to retrieve users." });
    }
}

export async function createUser(req, res) {
    const { name, email, password, phone, role, assignedWarehouses, image, imageFileId } = req.body ?? {};
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || !isValidEmail(normalizedEmail) || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Name, valid email, and a password of at least 6 characters are required." });
    }
    if (role !== undefined && !roles.includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
    }
    if (assignedWarehouses !== undefined && !Array.isArray(assignedWarehouses)) {
        return res.status(400).json({ message: "assignedWarehouses must be an array." });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            name: normalizedName,
            email: normalizedEmail,
            password: passwordHash,
            phone,
            role: role ?? "salesRepresentative",
            assignedWarehouses,
            image,
            imageFileId
        });
        const createdUser = await userModel.findById(user._id)
            .select("-password -googleId")
            .populate("assignedWarehouses", "name location");
        return res.status(201).json({
            message: "User created successfully.",
            user: formatUser(createdUser)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        if (error instanceof mongoose.Error) {
            return res.status(400).json({ message: "User details are invalid." });
        }
        console.error(error);
        return res.status(500).json({ message: "Unable to create user." });
    }
}

export async function updateUser(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }
    const userId = new mongoose.Types.ObjectId(id).toString();

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
    }

    const allowedFields = isAdmin ? adminEditableFields : selfEditableFields;
    const submittedFields = Object.keys(req.body ?? {});
    const disallowedFields = submittedFields.filter(field => !allowedFields.includes(field));
    if (disallowedFields.length) {
        return res.status(isAdmin ? 400 : 403).json({
            message: isAdmin
                ? `Unsupported user fields: ${disallowedFields.join(", ")}.`
                : "You can only update your name, phone, image, and imageFileId."
        });
    }
    if (!submittedFields.length) {
        return res.status(400).json({ message: "At least one user field must be provided." });
    }

    const updates = { ...req.body };
    if ("name" in updates && (typeof updates.name !== "string" || !updates.name.trim())) {
        return res.status(400).json({ message: "Name must not be empty." });
    }
    if ("phone" in updates && updates.phone !== null && typeof updates.phone !== "string") {
        return res.status(400).json({ message: "Phone must be a string." });
    }
    for (const field of ["image", "imageFileId"]) {
        if (field in updates && updates[field] !== null && typeof updates[field] !== "string") {
            return res.status(400).json({ message: `${field} must be a string.` });
        }
    }
    if ("email" in updates) {
        if (!isValidEmail(updates.email)) {
            return res.status(400).json({ message: "A valid email address is required." });
        }
        updates.email = updates.email.trim().toLowerCase();
    }
    if ("role" in updates && !roles.includes(updates.role)) {
        return res.status(400).json({ message: "Invalid role." });
    }
    if ("assignedWarehouses" in updates && !Array.isArray(updates.assignedWarehouses)) {
        return res.status(400).json({ message: "assignedWarehouses must be an array." });
    }
    if ("password" in updates) {
        if (typeof updates.password !== "string" || updates.password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }
    }
    if ("name" in updates) {
        updates.name = updates.name.trim();
    }

    try {
        const existingUser = await userModel.findById(userId).select("image imageFileId");
        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }
        const oldImageFileId = existingUser.imageFileId;
        if (typeof updates.imageFileId === "string" &&
            updates.imageFileId.trim() &&
            updates.imageFileId !== oldImageFileId) {
            if (typeof updates.image !== "string" || !updates.image.trim()) {
                return res.status(400).json({ message: "A new image URL is required with imageFileId." });
            }
            await verifyImage(updates.imageFileId, updates.image);
        }

        if ("password" in updates) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        const user = await userModel.findByIdAndUpdate(userId, updates, {
            returnDocument: "after",
            runValidators: true
        }).select("-password -googleId").populate("assignedWarehouses", "name location");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (updates.imageFileId && updates.imageFileId !== oldImageFileId) {
            await deleteImage(oldImageFileId);
        }
        return res.status(200).json({
            message: "User updated successfully.",
            user: formatUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        if (error instanceof mongoose.Error) {
            return res.status(400).json({ message: "User details are invalid." });
        }
        console.error(error);
        return res.status(500).json({ message: "Unable to update user." });
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }
    const userId = new mongoose.Types.ObjectId(id).toString();
    if (req.user.id === userId) {
        return res.status(400).json({ message: "You cannot delete your own account." });
    }

    try {
        const user = await userModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to delete user." });
    }
}
