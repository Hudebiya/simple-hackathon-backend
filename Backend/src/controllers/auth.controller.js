import userModel from "../models/users.model.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
}

function formatUser(user) {
    return {
        id: user._id.toString(),
        name: user.username,
        email: user.email,
        role: user.role
    }
}

async function registerUser(req, res) {
    const { username, email, password } = req.body ?? {}
    const normalizedUsername = typeof username === "string" ? username.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim() : ""

    if (!normalizedUsername || !normalizedEmail || typeof password !== "string" || !password) {
        return res.status(400).json({ message: "Username, email, and password are required." })
    }
    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: "A valid email address is required." })
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." })
    }

   try {
    const userAlreadyExists= await userModel.findOne({
        $or:[
            { username: normalizedUsername },
            { email: normalizedEmail }
        ]
    })

    if(userAlreadyExists){
        return res.status(409).json({
            message:"User Already Exists"
        })
    }

    const hash = await bcrypt.hash(password, 10);

    const user= await userModel.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hash,
        role: "user"
    })
    const token= jwt.sign({
        id: user._id,
        role: user.role
    },process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

    res.cookie("token",token,cookieOptions)

    res.status(201).json({
        message:"User created sucessfully",
        user: formatUser(user),
        token
    })
   } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
    
   }
}

async function loginUser(req, res) {
    const { username, email, password } = req.body ?? {}
    const normalizedUsername = typeof username === "string" ? username.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim() : ""

    if (!normalizedUsername && !normalizedEmail) {
        return res.status(400).json({ message: "Email or username is required." })
    }
    if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: "A valid email address is required." })
    }
    if (typeof password !== "string" || !password) {
        return res.status(400).json({ message: "Password is required." })
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." })
    }

    const identityConditions = []
    if (normalizedUsername) identityConditions.push({ username: normalizedUsername })
    if (normalizedEmail) identityConditions.push({ email: normalizedEmail })
    const user = await userModel.findOne({ $or: identityConditions })

    if (!user?.password) {
        return res.status(401).json({ message: "Invalid email or password" })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" })
    }

    const token= jwt.sign({
        id: user._id,
        role: user.role
    },process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

    res.cookie("token",token,cookieOptions)

    res.status(200).json({
        message:"User logged in sucessfully",
        user: formatUser(user),
        token
    })
    

}

async function getCurrentUser(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password")
        if (!user) {
            return res.status(401).json({ message: "User session is no longer valid" })
        }

        res.status(200).json({
            user: formatUser(user)
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Unable to check session" })
    }
}

function logoutUser(req, res) {
    res.clearCookie("token", cookieOptions)
    res.status(200).json({ message: "User logged out successfully" })
}

export { registerUser, loginUser, getCurrentUser, logoutUser, cookieOptions }