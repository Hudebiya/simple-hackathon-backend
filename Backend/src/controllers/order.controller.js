import mongoose from "mongoose";
import orderModel from "../models/Order.model.js";
import productModel from "../models/Product.model.js";
import stockModel from "../models/Stock.model.js";
import transactionModel from "../models/StockTransaction.model.js";
import warehouseModel from "../models/Warehouse.model.js";
import { canAccessWarehouse } from "../utils/warehouseAccess.js";
import { sendControllerError } from "../utils/errors.js";

const orderStatuses = ["Pending", "Processing", "Completed", "Cancelled"];

function isPositiveInteger(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function orderVisibleToUser(order, user) {
    if (user.role === "admin") return true;
    if (user.role === "salesRepresentative") {
        return order.createdBy?._id?.toString() === user.id;
    }
    return user.role === "warehouseManager" && canAccessWarehouse(user, order.warehouse?._id);
}

export async function createOrder(req, res) {
    const { customerName, customerPhone, warehouse, products } = req.body ?? {};
    if (typeof customerName !== "string" || !customerName.trim() ||
        typeof customerPhone !== "string" || !customerPhone.trim()) {
        return res.status(400).json({ message: "Customer name and phone are required." });
    }
    if (!mongoose.Types.ObjectId.isValid(warehouse)) {
        return res.status(400).json({ message: "A valid warehouse is required." });
    }
    if (!Array.isArray(products) || !products.length) {
        return res.status(400).json({ message: "At least one product is required." });
    }
    const seenProducts = new Set();
    for (const item of products) {
        if (!mongoose.Types.ObjectId.isValid(item?.product) || !isPositiveInteger(item?.quantity)) {
            return res.status(400).json({ message: "Each order item needs a valid product and positive integer quantity." });
        }
        const productId = new mongoose.Types.ObjectId(item.product).toString();
        if (seenProducts.has(productId)) {
            return res.status(400).json({ message: "Duplicate products are not allowed in an order." });
        }
        seenProducts.add(productId);
    }

    try {
        const warehouseExists = await warehouseModel.exists({ _id: warehouse });
        if (!warehouseExists) {
            return res.status(404).json({ message: "Warehouse not found." });
        }
        const productDocs = await productModel.find({ _id: { $in: [...seenProducts] } }).select("name price");
        const productsById = new Map(productDocs.map(product => [product._id.toString(), product]));
        if (productsById.size !== seenProducts.size) {
            return res.status(404).json({ message: "One or more products were not found." });
        }

        const orderProducts = [];
        let totalAmount = 0;
        for (const item of products) {
            const product = productsById.get(new mongoose.Types.ObjectId(item.product).toString());
            const stock = await stockModel.findOne({
                product: product._id,
                warehouse,
                quantity: { $gte: item.quantity }
            }).select("quantity");
            if (!stock) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}.` });
            }
            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });
            totalAmount += product.price * item.quantity;
        }
        if (!Number.isFinite(totalAmount)) {
            return res.status(400).json({ message: "Order total is outside the supported range." });
        }

        const order = await orderModel.create({
            orderNumber: `ORD-${Date.now()}`,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            products: orderProducts,
            totalAmount,
            warehouse,
            createdBy: req.user.id,
            status: "Pending"
        });
        await order.populate([
            { path: "products.product", select: "name sku" },
            { path: "warehouse" },
            { path: "createdBy", select: "name" }
        ]);
        return res.status(201).json({ message: "Order created successfully.", order });
    } catch (error) {
        return sendControllerError(res, error, "Unable to create order.");
    }
}

export async function getOrders(req, res) {
    try {
        const filter = {};
        if (req.query.status !== undefined) {
            if (!orderStatuses.includes(req.query.status)) {
                return res.status(400).json({ message: "Invalid order status filter." });
            }
            filter.status = req.query.status;
        }
        if (req.user.role === "salesRepresentative") {
            filter.createdBy = req.user.id;
        } else if (req.user.role === "warehouseManager") {
            filter.warehouse = { $in: req.user.assignedWarehouses };
        }

        const orders = await orderModel.find(filter)
            .populate("products.product", "name sku")
            .populate("warehouse")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve orders.");
    }
}

export async function getOrder(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
    }
    try {
        const order = await orderModel.findById(id)
            .populate("products.product", "name sku")
            .populate("warehouse")
            .populate("createdBy", "name");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        if (!orderVisibleToUser(order, req.user)) {
            return res.status(403).json({ message: "Access denied" });
        }
        return res.status(200).json({ order });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve order.");
    }
}

async function restoreOrderStock(deductedItems, warehouseId) {
    const failures = [];
    for (const item of deductedItems) {
        try {
            const restored = await stockModel.findOneAndUpdate(
                { product: item.product, warehouse: warehouseId },
                { $inc: { quantity: item.quantity } },
                { returnDocument: "after" }
            );
            if (!restored) failures.push(item.product.toString());
        } catch (error) {
            failures.push(error);
        }
    }
    return failures;
}

export async function updateOrderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
    }
    if (status !== "Processing" && status !== "Completed") {
        return res.status(400).json({ message: "Status must be Processing or Completed." });
    }

    let order;
    try {
        order = await orderModel.findById(id).populate("products.product", "name");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        if (!canAccessWarehouse(req.user, order.warehouse)) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (status === "Completed") {
            const completed = await orderModel.findOneAndUpdate(
                { _id: id, status: "Processing" },
                { $set: { status: "Completed" } },
                { returnDocument: "after", runValidators: true }
            );
            if (!completed) {
                return res.status(400).json({ message: "Only Processing orders can be completed." });
            }
            await completed.populate([
                { path: "products.product", select: "name sku" },
                { path: "warehouse" },
                { path: "createdBy", select: "name" }
            ]);
            return res.status(200).json({ message: "Order completed successfully.", order: completed });
        }

        const claimedOrder = await orderModel.findOneAndUpdate(
            { _id: id, status: "Pending" },
            { $set: { status: "Processing" } },
            { returnDocument: "after", runValidators: true }
        );
        if (!claimedOrder) {
            return res.status(400).json({ message: "Only Pending orders can be processed." });
        }

        const deductedItems = [];
        const createdTransactions = [];
        let insufficientProduct;
        const productNames = new Map(order.products.map(item => {
            const productId = item.product?._id ?? item.product;
            return [productId?.toString() ?? "", item.product?.name];
        }));
        try {
            for (const item of claimedOrder.products) {
                const updatedStock = await stockModel.findOneAndUpdate(
                    {
                        product: item.product?._id ?? item.product,
                        warehouse: claimedOrder.warehouse,
                        quantity: { $gte: item.quantity }
                    },
                    { $inc: { quantity: -item.quantity } },
                    { returnDocument: "after" }
                );
                if (!updatedStock) {
                    const productId = (item.product?._id ?? item.product)?.toString() ?? "";
                    insufficientProduct = productNames.get(productId) ?? "a product";
                    break;
                }
                deductedItems.push({
                    product: item.product?._id ?? item.product,
                    quantity: item.quantity
                });
            }
            if (insufficientProduct) {
                const rollbackErrors = await restoreOrderStock(deductedItems, claimedOrder.warehouse);
                const resetOrder = await orderModel.findOneAndUpdate(
                    { _id: id, status: "Processing" },
                    { $set: { status: "Pending" } },
                    { returnDocument: "after" }
                );
                if (rollbackErrors.length || !resetOrder) {
                    console.error("Unable to fully roll back order processing.", rollbackErrors);
                    return res.status(500).json({ message: "Unable to restore inventory; contact support." });
                }
                return res.status(400).json({ message: `Insufficient stock for ${insufficientProduct}.` });
            }

            for (const item of deductedItems) {
                const transaction = await transactionModel.create({
                    product: item.product,
                    warehouse: claimedOrder.warehouse,
                    transactionType: "stock-out",
                    quantity: item.quantity,
                    note: `Order ${claimedOrder.orderNumber}`,
                    performedBy: req.user.id
                });
                createdTransactions.push(transaction._id);
            }
        } catch (error) {
            const rollbackErrors = await restoreOrderStock(deductedItems, claimedOrder.warehouse);
            if (createdTransactions.length) {
                await transactionModel.deleteMany({ _id: { $in: createdTransactions } });
            }
            const resetOrder = await orderModel.findOneAndUpdate(
                { _id: id, status: "Processing" },
                { $set: { status: "Pending" } },
                { returnDocument: "after" }
            );
            if (rollbackErrors.length || !resetOrder) {
                console.error("Unable to fully roll back order processing.", error, rollbackErrors);
                return res.status(500).json({ message: "Unable to restore inventory; contact support." });
            }
            throw error;
        }

        const processedOrder = await orderModel.findById(id)
            .populate("products.product", "name sku")
            .populate("warehouse")
            .populate("createdBy", "name");
        return res.status(200).json({ message: "Order processing started.", order: processedOrder });
    } catch (error) {
        return sendControllerError(res, error, "Unable to update order status.");
    }
}

export async function cancelOrder(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
    }
    try {
        const order = await orderModel.findById(id).select("createdBy status");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        if (req.user.role === "salesRepresentative" && order.createdBy?.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (order.status !== "Pending") {
            return res.status(400).json({ message: "Only Pending orders can be cancelled." });
        }
        const cancelledOrder = await orderModel.findOneAndUpdate(
            { _id: id, status: "Pending" },
            { $set: { status: "Cancelled" } },
            { returnDocument: "after", runValidators: true }
        );
        if (!cancelledOrder) {
            return res.status(400).json({ message: "Only Pending orders can be cancelled." });
        }
        return res.status(200).json({ message: "Order cancelled successfully.", order: cancelledOrder });
    } catch (error) {
        return sendControllerError(res, error, "Unable to cancel order.");
    }
}
