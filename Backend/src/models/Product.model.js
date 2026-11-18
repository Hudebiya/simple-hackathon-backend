import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    sku: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    lowStockLimit: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    imageFileId: { type: String },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true })

export default mongoose.models.Product || mongoose.model("Product", productSchema)
