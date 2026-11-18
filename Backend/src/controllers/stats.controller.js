import userModel from "../models/users.model.js";
import productModel from "../models/Product.model.js";
import warehouseModel from "../models/Warehouse.model.js";
import stockModel from "../models/Stock.model.js";
import orderModel from "../models/Order.model.js";
import { sendControllerError } from "../utils/errors.js";

export async function getStats(_req, res) {
    try {
        const [users, products, warehouses, suppliers, orders, lowStockResult] = await Promise.all([
            userModel.countDocuments(),
            productModel.countDocuments(),
            warehouseModel.countDocuments(),
            userModel.countDocuments({ role: "supplier" }),
            orderModel.countDocuments(),
            stockModel.aggregate([
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
                { $count: "count" }
            ])
        ]);
        return res.status(200).json({
            users,
            products,
            warehouses,
            suppliers,
            orders,
            lowStock: lowStockResult[0]?.count ?? 0
        });
    } catch (error) {
        return sendControllerError(res, error, "Unable to retrieve system statistics.");
    }
}
