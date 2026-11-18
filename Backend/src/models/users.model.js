import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ["admin", "warehouseManager", "supplier", "salesRepresentative"],
        default: "salesRepresentative"
    },
    assignedWarehouses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse"
    }],
    image: {
        type: String
    },
    imageFileId: {
        type: String
    }
}, { timestamps: true })

const userModel = mongoose.models.User || mongoose.model("User", userSchema)
if (!mongoose.models.user) {
    mongoose.model("user", userSchema)
}

export default userModel
