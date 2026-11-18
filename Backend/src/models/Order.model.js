import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
    }],
    totalAmount: { type: Number, required: true, min: 0 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["Pending", "Processing", "Completed", "Cancelled"],
        default: "Pending"
    }
}, { timestamps: true })

export default mongoose.models.Order || mongoose.model("Order", orderSchema)
