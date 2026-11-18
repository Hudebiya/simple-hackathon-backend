import mongoose from "mongoose";
import productModel from "../models/Product.model.js";
import supplyRequestModel from "../models/SupplyRequest.model.js";
import warehouseModel from "../models/Warehouse.model.js";
import { canAccessWarehouse } from "../utils/warehouseAccess.js";
import { sendControllerError } from "../utils/errors.js";

function isPositiveInteger(value) {
    return Number.isSafeInteger(value) && value > 0;
}

export async function createSupplyRequest(req, res) {
    const { product, warehouse, quantity, note } = req.body ?? {};
    if (!mongoose.Types.ObjectId.isValid(product) || !mongoose.Types.ObjectId.isValid(warehouse)) {
        return res.status(400).json({ message: "Valid product and warehouse IDs are required." });
    }
    if (!isPositiveInteger(quantity)) {
        return res.status(400).json({ message: "Quantity must be a positive integer." });
    }
    if (note !== undefined && typeof note !== "string") {
        return res.status(400).json({ message: "Note must be a string." });
    }

    try {
        const [productDoc, warehouseExists] = await Promise.all([
            productModel.findById(product).select("supplier"),
            warehouseModel.exists({ _id: warehouse })
        ]);
        if (!productDoc) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (!warehouseExists) {
            return res.status(404).json({ message: "Warehouse not found." });
        }
        if (productDoc.supplier?.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only request supplies for your own products." });
        }

        const supplyRequest = await supplyRequestModel.create({
            supplier: req.user.id,
            product,
            warehouse,
            quantity,
            note,
            status: "Pending"
        });
        await supplyRequest.populate([
            { path: "product" },
            { path: "warehouse" },
            { path: "supplier", select: "name" },
            { path: "reviewedBy", select: "name" }
        ]);
        return res.status(201).json({ message: "Supply request created successfully.", supplyRequest });
    } catch (error) {
        return sendControllerError(res, error, "Unable to create supply request.");
    }
}

export async function getSupplyRequests(req, res) {
    try {
        const filter = {};
        if (req.user.role === "supplier") {
            filter.supplier = req.user.id;
        } else if (req.user.role === "warehouseManager") {
            filter.warehouse = { $in: req.user.assignedWarehouses };
        }
        const supplyRequests = await supplyRequestModel.find(filter)
            .populate("product")
            .populate("warehouse")
            .populate("supplier", "name")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 });
        return res.status(200).json({ supplyRequests });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve supply requests.");
    }
}

export async function updateSupplyRequestStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid supply request ID." });
    }
    if (status !== "Approved" && status !== "Rejected") {
        return res.status(400).json({ message: "Status must be Approved or Rejected." });
    }

    try {
        const existing = await supplyRequestModel.findById(id).select("warehouse status");
        if (!existing) {
            return res.status(404).json({ message: "Supply request not found." });
        }
        if (!canAccessWarehouse(req.user, existing.warehouse)) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (existing.status !== "Pending") {
            return res.status(400).json({ message: "Only Pending supply requests can be reviewed." });
        }

        const supplyRequest = await supplyRequestModel.findOneAndUpdate(
            { _id: id, status: "Pending" },
            { $set: { status, reviewedBy: req.user.id } },
            { returnDocument: "after", runValidators: true }
        )
            .populate("product")
            .populate("warehouse")
            .populate("supplier", "name")
            .populate("reviewedBy", "name");
        if (!supplyRequest) {
            return res.status(400).json({ message: "Only Pending supply requests can be reviewed." });
        }
        return res.status(200).json({ message: "Supply request reviewed successfully.", supplyRequest });
    } catch (error) {
        return sendControllerError(res, error, "Unable to review supply request.");
    }
}
