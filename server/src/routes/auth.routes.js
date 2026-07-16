const express = require("express");
const jwt = require("jsonwebtoken");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const {
    register,
    login,
    verifyEmail,
    getMe,
    updateProfile,
    createRecruiter,
} = require("../controllers/auth.controller");
const ApiError = require("../utils/ApiError");

const router = express.Router();

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Unauthorized");
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        next(err);
    }
};

const requireRecruiter = (req, res, next) => {
    if (!req.user || req.user.role !== 'recruiter') {
        return res.status(403).json({ success: false, message: "Recruiter privilege required." });
    }
    next();
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { default: false },
    keyGenerator: (req) => {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "unknown";

        return `${ipKeyGenerator(req.ip)}:${email}`;
    },
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { default: false },
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: {
        success: false,
        message: "Too many registrations from this IP. Please try again later.",
    },
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", authenticate, getMe);
router.get("/verify-email/:token", verifyEmail);
router.put("/update-profile", authenticate, updateProfile);
router.post("/create-recruiter", authenticate, requireRecruiter, createRecruiter);

module.exports = router;
