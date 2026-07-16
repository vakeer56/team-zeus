const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt.js");
const ApiError = require("../utils/ApiError");

const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const parseBody = (schema, body) => {
    const result = schema.safeParse(body);

    if (!result.success) {
        const message = result.error.issues[0]?.message || "Invalid request body";
        throw new ApiError(400, message);
    }

    return result.data;
};

const sendVerificationEmail = (user, token) => {
    console.log(`Verification email for ${user.email}: ${token}`);
};

const register = async (req, res, next) => {
    try {
        const { name, email, password } = parseBody(registerSchema, req.body);
        const normalizedEmail = email.toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            throw new ApiError(400, "Email already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "candidate",
            isVerified: false,
            verificationToken,
        });

        sendVerificationEmail(user, verificationToken);

        const token = generateToken({
            id: user._id,
            role: user.role,
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = parseBody(loginSchema, req.body);
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select("+password");
        const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

        if (!user || !isMatch) {
            throw new ApiError(401, "Invalid credentials");
        }

        const token = generateToken({
            id: user._id,
            role: user.role,
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            throw new ApiError(400, "Invalid or expired verification token");
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (err) {
        next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    getMe,
};