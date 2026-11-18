import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import userModel from "./src/models/users.model.js";
import productModel from "./src/models/Product.model.js";
import warehouseModel from "./src/models/Warehouse.model.js";
import stockModel from "./src/models/Stock.model.js";
import transactionModel from "./src/models/StockTransaction.model.js";

const demoUsers = [
    {
        name: "Demo Warehouse Manager",
        email: "manager@example.com",
        password: "Manager123!",
        phone: "555-0101",
        role: "warehouseManager"
    },
    {
        name: "Demo Supplier",
        email: "supplier@example.com",
        password: "Supplier123!",
        phone: "555-0102",
        role: "supplier"
    },
    {
        name: "Demo Sales Representative",
        email: "sales@example.com",
        password: "Sales123!",
        phone: "555-0103",
        role: "salesRepresentative"
    }
];

const demoWarehouses = [
    { name: "Demo Central Warehouse", location: "Central District", capacity: 1000 },
    { name: "Demo North Warehouse", location: "North District", capacity: 750 }
];

const demoProducts = [
    { name: "Wireless Mouse", description: "Ergonomic wireless mouse", sku: "DEMO-MOUSE-001", category: "Accessories", price: 24.99, lowStockLimit: 10, stock: 50 },
    { name: "USB-C Cable", description: "One meter USB-C cable", sku: "DEMO-CABLE-001", category: "Accessories", price: 9.99, lowStockLimit: 20, stock: 100 },
    { name: "Laptop Stand", description: "Adjustable aluminum laptop stand", sku: "DEMO-STAND-001", category: "Office", price: 39.5, lowStockLimit: 8, stock: 30 },
    { name: "Desk Lamp", description: "Dimmable LED desk lamp", sku: "DEMO-LAMP-001", category: "Office", price: 32, lowStockLimit: 10, stock: 25 },
    { name: "Keyboard", description: "Compact wired keyboard", sku: "DEMO-KEYBOARD-001", category: "Accessories", price: 29.99, lowStockLimit: 12, stock: 40 }
];

try {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = {};
    for (const demoUser of demoUsers) {
        const password = await bcrypt.hash(demoUser.password, 10);
        users[demoUser.role] = await userModel.findOneAndUpdate(
            { email: demoUser.email },
            {
                $set: {
                    name: demoUser.name,
                    email: demoUser.email,
                    password,
                    phone: demoUser.phone,
                    role: demoUser.role
                }
            },
            { upsert: true, returnDocument: "after", runValidators: true }
        );
    }

    const warehouseManager = users.warehouseManager;
    const warehouses = [];
    for (const demoWarehouse of demoWarehouses) {
        const existing = await warehouseModel.findOne({ name: demoWarehouse.name }).select("manager");
        const warehouse = await warehouseModel.findOneAndUpdate(
            { name: demoWarehouse.name },
            {
                $set: {
                    ...demoWarehouse,
                    manager: warehouseManager._id
                }
            },
            { upsert: true, returnDocument: "after", runValidators: true }
        );
        if (existing?.manager && existing.manager.toString() !== warehouseManager._id.toString()) {
            await userModel.updateOne(
                { _id: existing.manager },
                { $pull: { assignedWarehouses: warehouse._id } }
            );
        }
        warehouses.push(warehouse);
    }

    await userModel.updateOne(
        { _id: warehouseManager._id },
        { $addToSet: { assignedWarehouses: { $each: warehouses.map(warehouse => warehouse._id) } } }
    );

    const products = [];
    for (const demoProduct of demoProducts) {
        const { stock: initialQuantity, ...productFields } = demoProduct;
        const product = await productModel.findOneAndUpdate(
            { sku: productFields.sku },
            {
                $set: {
                    ...productFields,
                    supplier: users.supplier._id,
                    createdBy: warehouseManager._id,
                    imageUrl: null,
                    imageFileId: null
                }
            },
            { upsert: true, returnDocument: "after", runValidators: true }
        );
        products.push({ product, initialQuantity });
    }

    for (const { product, initialQuantity } of products) {
        for (const [index, warehouse] of warehouses.entries()) {
            const quantity = Math.floor(initialQuantity / warehouses.length) +
                (index < initialQuantity % warehouses.length ? 1 : 0);
            await stockModel.findOneAndUpdate(
                { product: product._id, warehouse: warehouse._id },
                { $set: { quantity } },
                { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
            );
            await transactionModel.findOneAndUpdate(
                {
                    product: product._id,
                    warehouse: warehouse._id,
                    transactionType: "stock-in",
                    note: "Demo seed initial stock",
                    performedBy: warehouseManager._id
                },
                {
                    $setOnInsert: {
                        product: product._id,
                        warehouse: warehouse._id,
                        transactionType: "stock-in",
                        quantity,
                        note: "Demo seed initial stock",
                        performedBy: warehouseManager._id
                    }
                },
                { upsert: true, returnDocument: "after", runValidators: true }
            );
        }
    }

    console.log("Demo data is ready. Demo credentials:");
    for (const demoUser of demoUsers) {
        console.log(`${demoUser.role}: ${demoUser.email} / ${demoUser.password}`);
    }
} catch (error) {
    console.error("Unable to seed demo data:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
