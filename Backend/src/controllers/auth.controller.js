import userModel from "../models/users.model.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const publicRoles = ["warehouseManager", "supplier", "salesRepresentative"]

const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
}

function formatUser(user, includeAssignedWarehouses = false) {
    const formattedUser = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        image: user.image
    }

    if (includeAssignedWarehouses) {
        formattedUser.assignedWarehouses = user.assignedWarehouses
    }

    return formattedUser
}

async function registerUser(req, res) {
    const { email, password, phone, role } = req.body ?? {}
    const name = req.body?.name ?? req.body?.username
    const normalizedName = typeof name === "string" ? name.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    if (!normalizedName || !normalizedEmail || typeof password !== "string" || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." })
    }
    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: "A valid email address is required." })
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." })
    }
    if (phone !== undefined && phone !== null && typeof phone !== "string") {
        return res.status(400).json({ message: "Phone must be a string." })
    }
    if (role === "admin") {
        return res.status(403).json({ message: "Admin accounts can only be created by an administrator." })
    }
    if (role !== undefined && !publicRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role." })
    }

    try {
        const userAlreadyExists = await userModel.findOne({ email: normalizedEmail })
        if (userAlreadyExists) {
            return res.status(409).json({ message: "An account with this email already exists." })
        }

        const hash = await bcrypt.hash(password, 10)
        const user = await userModel.create({
            name: normalizedName,
            email: normalizedEmail,
            password: hash,
            phone,
            role: role ?? "salesRepresentative"
        })
        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

        res.cookie("token", token, cookieOptions)
        return res.status(201).json({
            message: "User created successfully.",
            user: formatUser(user),
            token
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists." })
        }
        console.error(error)
        return res.status(500).json({ message: "Internal server error." })
    }
}

async function loginUser(req, res) {
    const { email, password } = req.body ?? {}
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    if (!normalizedEmail) {
        return res.status(400).json({ message: "Email is required." })
    }
    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: "A valid email address is required." })
    }
    if (typeof password !== "string" || !password) {
        return res.status(400).json({ message: "Password is required." })
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." })
    }

    const user = await userModel.findOne({ email: normalizedEmail })
    if (!user?.password) {
        return res.status(401).json({ message: "Invalid email or password." })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." })
    }

    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

    res.cookie("token", token, cookieOptions)
    return res.status(200).json({
        message: "User logged in successfully.",
        user: formatUser(user),
        token
    })
}

async function getCurrentUser(req, res) {
    try {
        const user = await userModel.findById(req.user.id)
            .select("-password -googleId")
            .populate("assignedWarehouses", "name location")
        if (!user) {
            return res.status(401).json({ message: "User session is no longer valid." })
        }

        return res.status(200).json({ user: formatUser(user, true) })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Unable to check session." })
    }
}

function logoutUser(req, res) {
    res.clearCookie("token", cookieOptions)
    return res.status(200).json({ message: "User logged out successfully." })
}

export { registerUser, loginUser, getCurrentUser, logoutUser, cookieOptions }
