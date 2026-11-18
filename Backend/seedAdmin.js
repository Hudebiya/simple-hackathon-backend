import "dotenv/config";
import mongoose from "mongoose";
import userModel from "./src/models/users.model.js";
import bcrypt from "bcryptjs";

const demoAdmin = {
    name: "Demo Admin",
    email: "admin@example.com",
    password: "Admin123!"
};

try {
    await mongoose.connect(process.env.MONGODB_URI);
    const password = await bcrypt.hash(demoAdmin.password, 10);
    await userModel.findOneAndUpdate(
        { email: demoAdmin.email },
        {
            $set: {
                name: demoAdmin.name,
                password,
                role: "admin"
            },
            $setOnInsert: { email: demoAdmin.email }
        },
        { upsert: true, returnDocument: "after", runValidators: true }
    );
    console.log("Demo admin account is ready:");
    console.log(`Email: ${demoAdmin.email}`);
    console.log(`Password: ${demoAdmin.password}`);
    console.log("Change the demo password before using this account outside development.");
} catch (error) {
    console.error("Unable to seed admin user:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
