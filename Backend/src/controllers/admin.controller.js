import bcrypt from "bcryptjs";
import userModel from "../models/users.model.js";
import appointmentModel from "../models/Appointment.model.js";

export async function getAllUsers(req, res) {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        const users = await userModel.find(filter).select("-password -cart").sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function addDoctor(req, res) {
    try {
        const { username, email, password, specialization, experience } = req.body;
        if (!username || !email || !password || !specialization) {
            return res.status(400).json({ message: "username, email, password and specialization are required" });
        }
        const exists = await userModel.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            return res.status(409).json({ message: "Username or email already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const doctor = await userModel.create({
            username,
            email,
            password: hashed,
            role: "doctor",
            specialization,
            experience: Number(experience) || 0,
            isActive: true
        });
        res.status(201).json({
            id: doctor._id,
            username: doctor.username,
            email: doctor.email,
            role: doctor.role,
            specialization: doctor.specialization,
            experience: doctor.experience
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function deleteUser(req, res) {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === "admin" || user._id.toString() === req.user.id) {
            return res.status(400).json({ message: "Cannot delete an admin" });
        }
        await appointmentModel.deleteMany({ $or: [{ patient: user._id }, { doctor: user._id }] });
        await user.deleteOne();
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export async function toggleUserActive(req, res) {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === "admin") {
            return res.status(400).json({ message: "Cannot deactivate an admin" });
        }
        user.isActive = user.isActive === false ? true : false;
        await user.save();
        res.json({ id: user._id, isActive: user.isActive });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export async function getAllAppointments(req, res) {
    try {
        const appointments = await appointmentModel
            .find()
            .populate("patient", "username email")
            .populate("doctor", "username specialization")
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function getStats(req, res) {
    try {
        const [totalPatients, totalDoctors, totalAppointments, pending, approved, rejected] =
            await Promise.all([
                userModel.countDocuments({ role: "patient" }),
                userModel.countDocuments({ role: "doctor" }),
                appointmentModel.countDocuments(),
                appointmentModel.countDocuments({ status: "pending" }),
                appointmentModel.countDocuments({ status: "approved" }),
                appointmentModel.countDocuments({ status: "rejected" })
            ]);
        res.json({ totalPatients, totalDoctors, totalAppointments, pending, approved, rejected });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}