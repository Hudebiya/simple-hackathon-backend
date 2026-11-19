import mongoose from "mongoose";
import warehouseModel from "../models/Warehouse.model.js";
import userModel from "../models/users.model.js";
import { sendControllerError } from "../utils/errors.js";

function isValidText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isValidCapacity(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

async function validateManager(managerId) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        return null;
    }
    return userModel.findOne({ _id: managerId, role: "warehouseManager" }).select("_id");
}

export async function createWarehouse(req, res) {
    const { name, location, capacity, manager } = req.body ?? {};
    if (!isValidText(name) || !isValidText(location) || !isValidCapacity(capacity)) {
        return res.status(400).json({ message: "Name, location, and a non-negative capacity are required." });
    }
    if (!await validateManager(manager)) {
        return res.status(400).json({ message: "Manager must be an existing warehouse manager." });
    }

    try {
        const warehouse = await warehouseModel.create({
            name: name.trim(),
            location: location.trim(),
            capacity,
            manager
        });
        const assignedManager = await userModel.findOneAndUpdate(
            { _id: manager, role: "warehouseManager" },
            { $addToSet: { assignedWarehouses: warehouse._id } },
            { returnDocument: "after" }
        );
        if (!assignedManager) {
            await warehouse.deleteOne();
            return res.status(400).json({ message: "Manager must be an existing warehouse manager." });
        }
        await warehouse.populate("manager", "name email");
        return res.status(201).json({ message: "Warehouse created successfully.", warehouse });
    } catch (error) {
        return sendControllerError(res, error, "Unable to create warehouse.");
    }
}

export async function getWarehouses(req, res) {
    try {
        if (req.user.role === "supplier") {
            const warehouses = await warehouseModel.find({})
                .select("name location -_id")
                .sort({ createdAt: -1 });
            return res.status(200).json({ warehouses });
        }

        const filter = req.user.role === "warehouseManager"
            ? { _id: { $in: req.user.assignedWarehouses } }
            : {};
        const warehouses = await warehouseModel.find(filter)
            .populate("manager", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ warehouses });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve warehouses.");
    }
}

export async function updateWarehouse(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID." });
    }
    const updates = req.body ?? {};
    const allowedFields = ["name", "location", "capacity", "manager"];
    const unsupported = Object.keys(updates).filter(field => !allowedFields.includes(field));
    if (unsupported.length) {
        return res.status(400).json({ message: `Unsupported warehouse fields: ${unsupported.join(", ")}.` });
    }
    if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "At least one warehouse field must be provided." });
    }
    if ("name" in updates && !isValidText(updates.name)) {
        return res.status(400).json({ message: "Name must not be empty." });
    }
    if ("location" in updates && !isValidText(updates.location)) {
        return res.status(400).json({ message: "Location must not be empty." });
    }
    if ("capacity" in updates && !isValidCapacity(updates.capacity)) {
        return res.status(400).json({ message: "Capacity must be a non-negative number." });
    }

    try {
        const warehouse = await warehouseModel.findById(id);
        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const previousManagerId = warehouse.manager?.toString();
        let nextManagerId = previousManagerId;
        if ("manager" in updates) {
            if (updates.manager === null || updates.manager === "") {
                nextManagerId = undefined;
            } else {
                if (!await validateManager(updates.manager)) {
                    return res.status(400).json({ message: "Manager must be an existing warehouse manager." });
                }
                nextManagerId = new mongoose.Types.ObjectId(updates.manager).toString();
            }
        }

        let managerPreassigned = false;
        if (nextManagerId && nextManagerId !== previousManagerId) {
            const manager = await userModel.findOneAndUpdate(
                { _id: nextManagerId, role: "warehouseManager" },
                { $addToSet: { assignedWarehouses: warehouse._id } },
                { returnDocument: "after" }
            );
            if (!manager) {
                return res.status(400).json({ message: "Manager must be an existing warehouse manager." });
            }
            managerPreassigned = true;
        }

        if ("name" in updates) warehouse.name = updates.name.trim();
        if ("location" in updates) warehouse.location = updates.location.trim();
        if ("capacity" in updates) warehouse.capacity = updates.capacity;
        if ("manager" in updates) warehouse.manager = nextManagerId ?? null;

        try {
            await warehouse.save();
        } catch (error) {
            if (managerPreassigned) {
                await userModel.updateOne(
                    { _id: nextManagerId },
                    { $pull: { assignedWarehouses: warehouse._id } }
                );
            }
            throw error;
        }

        if (previousManagerId && previousManagerId !== nextManagerId) {
            await userModel.updateOne(
                { _id: previousManagerId },
                { $pull: { assignedWarehouses: warehouse._id } }
            );
        }
        await warehouse.populate("manager", "name email");
        return res.status(200).json({ message: "Warehouse updated successfully.", warehouse });
    } catch (error) {
        return sendControllerError(res, error, "Unable to update warehouse.");
    }
}

export async function deleteWarehouse(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID." });
    }
    try {
        const warehouse = await warehouseModel.findByIdAndDelete(id);
        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found." });
        }
        await userModel.updateMany(
            { assignedWarehouses: warehouse._id },
            { $pull: { assignedWarehouses: warehouse._id } }
        );
        return res.status(200).json({ message: "Warehouse deleted successfully." });
    } catch (error) {
        return sendControllerError(res, error, "Unable to delete warehouse.");
    }
}
