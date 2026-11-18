import mongoose from "mongoose"

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    capacity: { type: Number, required: true, min: 0 }
}, { timestamps: true })

export default mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema)
