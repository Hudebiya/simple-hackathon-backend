import mongoose from "mongoose";
import productModel from "../models/Product.model.js";
import stockModel from "../models/Stock.model.js";
import userModel from "../models/users.model.js";
import { deleteImage, verifyImage } from "../utils/imagekit.js";
import { createHttpError, sendControllerError } from "../utils/errors.js";

const productFields = ["name", "description", "sku", "category", "price", "lowStockLimit", "supplier", "imageUrl", "imageFileId"];

function isNonnegativeNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateImagePair(imageUrl, imageFileId) {
    const hasUrl = typeof imageUrl === "string" && imageUrl.trim().length > 0;
    const hasFileId = typeof imageFileId === "string" && imageFileId.trim().length > 0;
    if (hasUrl !== hasFileId) {
        throw createHttpError(400, "imageUrl and imageFileId must be provided together.");
    }
    return hasUrl;
}

async function validateSupplier(supplierId) {
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        throw createHttpError(400, "A valid supplier is required.");
    }
    const supplier = await userModel.findOne({ _id: supplierId, role: "supplier" }).select("_id");
    if (!supplier) {
        throw createHttpError(400, "Supplier was not found.");
    }
}

export async function createProduct(req, res) {
    try {
        const { name, description, sku, category, price, lowStockLimit, supplier, imageUrl, imageFileId } = req.body ?? {};
        if (![name, description, sku, category].every(value => typeof value === "string" && value.trim())) {
            return res.status(400).json({ message: "Name, description, SKU, and category are required." });
        }
        if (!isNonnegativeNumber(price) || !isNonnegativeNumber(lowStockLimit)) {
            return res.status(400).json({ message: "Price and lowStockLimit must be non-negative numbers." });
        }

        await validateSupplier(supplier);
        const hasImage = validateImagePair(imageUrl, imageFileId);
        if (hasImage) {
            await verifyImage(imageFileId, imageUrl);
        }

        const product = await productModel.create({
            name: name.trim(),
            description: description.trim(),
            sku: sku.trim(),
            category: category.trim(),
            price,
            lowStockLimit,
            supplier,
            imageUrl: hasImage ? imageUrl : undefined,
            imageFileId: hasImage ? imageFileId : undefined,
            createdBy: req.user.id
        });
        await product.populate("supplier", "name email");
        return res.status(201).json({ message: "Product created successfully.", product });
    } catch (error) {
        return sendControllerError(res, error, "Unable to create product.");
    }
}

export async function getProducts(req, res) {
    try {
        const filter = {};
        if (req.query.category !== undefined) {
            if (typeof req.query.category !== "string" || !req.query.category.trim()) {
                return res.status(400).json({ message: "Category filter must not be empty." });
            }
            filter.category = req.query.category.trim();
        }
        if (req.query.supplier !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(req.query.supplier)) {
                return res.status(400).json({ message: "Invalid supplier ID." });
            }
            filter.supplier = new mongoose.Types.ObjectId(req.query.supplier).toString();
        }
        if (req.user.role === "supplier") {
            if (filter.supplier && filter.supplier !== req.user.id) {
                filter._id = { $in: [] };
            }
            filter.supplier = req.user.id;
        }
        if (req.query.search !== undefined) {
            if (typeof req.query.search !== "string") {
                return res.status(400).json({ message: "Search must be a string." });
            }
            const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
            filter.$or = [{ name: search }, { sku: search }];
        }

        const products = await productModel.find(filter)
            .populate("supplier", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ message: "Products retrieved successfully.", products });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve products.");
    }
}

export async function getProduct(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID." });
    }
    try {
        const product = await productModel.findById(id).populate("supplier", "name email");
        if (!product || (req.user.role === "supplier" && product.supplier?._id.toString() !== req.user.id)) {
            return res.status(404).json({ message: "Product not found." });
        }
        return res.status(200).json({ product });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve product.");
    }
}

export async function updateProduct(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID." });
    }
    const updates = req.body ?? {};
    const unsupportedFields = Object.keys(updates).filter(field => !productFields.includes(field));
    if (unsupportedFields.length) {
        return res.status(400).json({ message: `Unsupported product fields: ${unsupportedFields.join(", ")}.` });
    }
    if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "At least one product field must be provided." });
    }

    try {
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        for (const field of ["name", "description", "sku", "category"]) {
            if (field in updates) {
                if (typeof updates[field] !== "string" || !updates[field].trim()) {
                    return res.status(400).json({ message: `${field} must not be empty.` });
                }
                updates[field] = updates[field].trim();
            }
        }
        for (const field of ["price", "lowStockLimit"]) {
            if (field in updates && !isNonnegativeNumber(updates[field])) {
                return res.status(400).json({ message: `${field} must be a non-negative number.` });
            }
        }
        if ("supplier" in updates) {
            await validateSupplier(updates.supplier);
        }

        let hasImage = false;
        if ("imageUrl" in updates || "imageFileId" in updates) {
            if (!("imageUrl" in updates) || !("imageFileId" in updates)) {
                return res.status(400).json({ message: "imageUrl and imageFileId must be updated together." });
            }
            hasImage = validateImagePair(updates.imageUrl, updates.imageFileId);
            if (hasImage) await verifyImage(updates.imageFileId, updates.imageUrl);
            if (!hasImage) {
                updates.imageUrl = undefined;
                updates.imageFileId = undefined;
            }
        }

        const oldImageFileId = product.imageFileId;
        for (const field of productFields) {
            if (field in updates) {
                product[field] = updates[field];
            }
        }
        await product.save();
        if (updates.imageFileId && updates.imageFileId !== oldImageFileId) {
            await deleteImage(oldImageFileId);
        }
        await product.populate("supplier", "name email");
        return res.status(200).json({ message: "Product updated successfully.", product });
    } catch (error) {
        return sendControllerError(res, error, "Unable to update product.");
    }
}

export async function deleteProduct(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID." });
    }
    try {
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        await stockModel.deleteMany({ product: product._id });
        await product.deleteOne();
        await deleteImage(product.imageFileId);
        return res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
        return sendControllerError(res, error, "Unable to delete product.");
    }
}
