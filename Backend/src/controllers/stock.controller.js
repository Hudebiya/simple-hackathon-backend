import mongoose from "mongoose";
import productModel from "../models/Product.model.js";
import stockModel from "../models/Stock.model.js";
import transactionModel from "../models/StockTransaction.model.js";
import warehouseModel from "../models/Warehouse.model.js";
import { canAccessWarehouse } from "../utils/warehouseAccess.js";
import { sendControllerError } from "../utils/errors.js";

function isPositiveInteger(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function validateStockLocation(productId, warehouseId, user, res) {
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
        res.status(400).json({ message: "Valid productId and warehouseId are required." });
        return null;
    }

    const [product, warehouse] = await Promise.all([
        productModel.findById(productId).select("_id"),
        warehouseModel.findById(warehouseId).select("_id")
    ]);
    if (!product) {
        res.status(404).json({ message: "Product not found." });
        return null;
    }
    if (!warehouse) {
        res.status(404).json({ message: "Warehouse not found." });
        return null;
    }
    if (!canAccessWarehouse(user, warehouse._id)) {
        res.status(403).json({ message: "Access denied" });
        return null;
    }
    return { product, warehouse };
}

async function recordStockChange({ productId, warehouseId, quantity, note, user, direction, res }) {
    try {
        const location = await validateStockLocation(productId, warehouseId, user, res);
        if (!location) return;

        let updatedStock;
        if (direction === "in") {
            try {
                updatedStock = await stockModel.findOneAndUpdate(
                    { product: productId, warehouse: warehouseId },
                    { $inc: { quantity } },
                    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
                );
            } catch (error) {
                if (error.code !== 11000) throw error;
                updatedStock = await stockModel.findOneAndUpdate(
                    { product: productId, warehouse: warehouseId },
                    { $inc: { quantity } },
                    { returnDocument: "after" }
                );
            }
        } else {
            updatedStock = await stockModel.findOneAndUpdate(
                { product: productId, warehouse: warehouseId, quantity: { $gte: quantity } },
                { $inc: { quantity: -quantity } },
                { returnDocument: "after" }
            );
            if (!updatedStock) {
                return res.status(400).json({ message: "Insufficient stock" });
            }
        }

        try {
            const transaction = await transactionModel.create({
                product: productId,
                warehouse: warehouseId,
                transactionType: direction === "in" ? "stock-in" : "stock-out",
                quantity,
                note,
                performedBy: user.id
            });
            return res.status(200).json({
                message: direction === "in" ? "Stock added successfully." : "Stock removed successfully.",
                stock: updatedStock,
                transaction
            });
        } catch (error) {
            const reverseAmount = direction === "in" ? -quantity : quantity;
            const rollback = await stockModel.findOneAndUpdate(
                { product: productId, warehouse: warehouseId, ...(reverseAmount < 0 ? { quantity: { $gte: quantity } } : {}) },
                { $inc: { quantity: reverseAmount } },
                { returnDocument: "after" }
            );
            if (!rollback) {
                console.error("Failed to roll back a stock change after transaction creation failed.");
            }
            throw error;
        }
    } catch (error) {
        return sendControllerError(res, error, "Unable to update stock.");
    }
}

export async function stockIn(req, res) {
    const { productId, warehouseId, quantity, note } = req.body ?? {};
    if (!isPositiveInteger(quantity)) {
        return res.status(400).json({ message: "Quantity must be a positive integer." });
    }
    if (note !== undefined && typeof note !== "string") {
        return res.status(400).json({ message: "Note must be a string." });
    }
    return recordStockChange({ productId, warehouseId, quantity, note, user: req.user, direction: "in", res });
}

export async function stockOut(req, res) {
    const { productId, warehouseId, quantity, note } = req.body ?? {};
    if (!isPositiveInteger(quantity)) {
        return res.status(400).json({ message: "Quantity must be a positive integer." });
    }
    if (note !== undefined && typeof note !== "string") {
        return res.status(400).json({ message: "Note must be a string." });
    }
    return recordStockChange({ productId, warehouseId, quantity, note, user: req.user, direction: "out", res });
}

export async function getStock(req, res) {
    try {
        const filter = {};
        const assignedWarehouseIds = req.user.role === "warehouseManager"
            ? req.user.assignedWarehouses.map(id => id.toString())
            : null;
        if (req.query.warehouse !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(req.query.warehouse)) {
                return res.status(400).json({ message: "Invalid warehouse ID." });
            }
            const requestedWarehouseId = new mongoose.Types.ObjectId(req.query.warehouse).toString();
            filter.warehouse = assignedWarehouseIds
                ? { $in: assignedWarehouseIds.filter(id => id === requestedWarehouseId) }
                : requestedWarehouseId;
        } else if (assignedWarehouseIds) {
            filter.warehouse = { $in: assignedWarehouseIds };
        }
        let requestedProductId;
        if (req.query.product !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(req.query.product)) {
                return res.status(400).json({ message: "Invalid product ID." });
            }
            requestedProductId = new mongoose.Types.ObjectId(req.query.product).toString();
            filter.product = requestedProductId;
        }
        if (req.query.search !== undefined) {
            if (typeof req.query.search !== "string") {
                return res.status(400).json({ message: "Search must be a string." });
            }
            const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
            const productIds = await productModel.find({ $or: [{ name: search }, { sku: search }] }).distinct("_id");
            filter.product = requestedProductId
                ? { $in: productIds.filter(id => id.toString() === requestedProductId) }
                : { $in: productIds };
        }

        const stock = await stockModel.find(filter)
            .populate("product", "name sku price imageUrl lowStockLimit")
            .populate("warehouse", "name location")
            .sort({ updatedAt: -1 });
        return res.status(200).json({ stock });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve stock.");
    }
}

export async function getLowStock(req, res) {
    try {
        const match = req.user.role === "warehouseManager"
            ? { warehouse: { $in: req.user.assignedWarehouses } }
            : {};
        const lowStock = await stockModel.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: productModel.collection.name,
                    localField: "product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            { $match: { $expr: { $lte: ["$quantity", "$product.lowStockLimit"] } } },
            {
                $lookup: {
                    from: warehouseModel.collection.name,
                    localField: "warehouse",
                    foreignField: "_id",
                    as: "warehouse"
                }
            },
            { $unwind: "$warehouse" },
            { $sort: { updatedAt: -1 } },
            {
                $project: {
                    quantity: 1,
                    product: { _id: 1, name: 1, sku: 1, price: 1, imageUrl: 1, lowStockLimit: 1 },
                    warehouse: { _id: 1, name: 1, location: 1 }
                }
            }
        ]);
        return res.status(200).json({ lowStock });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve low-stock records.");
    }
}

export async function getTransactions(req, res) {
    try {
        const filter = {};
        const assignedWarehouseIds = req.user.role === "warehouseManager"
            ? req.user.assignedWarehouses.map(id => id.toString())
            : null;
        if (req.query.warehouse !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(req.query.warehouse)) {
                return res.status(400).json({ message: "Invalid warehouse ID." });
            }
            const requestedWarehouseId = new mongoose.Types.ObjectId(req.query.warehouse).toString();
            filter.warehouse = assignedWarehouseIds
                ? { $in: assignedWarehouseIds.filter(id => id === requestedWarehouseId) }
                : requestedWarehouseId;
        }
        if (req.query.product !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(req.query.product)) {
                return res.status(400).json({ message: "Invalid product ID." });
            }
            filter.product = req.query.product;
        }
        if (req.query.type !== undefined) {
            if (!["stock-in", "stock-out"].includes(req.query.type)) {
                return res.status(400).json({ message: "Invalid transaction type." });
            }
            filter.transactionType = req.query.type;
        }
        if (assignedWarehouseIds && req.query.warehouse === undefined) {
            filter.warehouse = { $in: assignedWarehouseIds };
        }

        const transactions = await transactionModel.find(filter)
            .populate("product", "name sku")
            .populate("warehouse", "name location")
            .populate("performedBy", "name")
            .sort({ date: -1, createdAt: -1 });
        return res.status(200).json({ transactions });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve stock transactions.");
    }
}
