const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const {
    register,
    login,
    verifyEmail,
    getMe,
    updateProfile,
    createRecruiter,
    forgotPassword,
    resetPassword,
} = require("../controllers/auth.controller");
const { authenticate, authorize } = require("../middleware/authenticate");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    keyGenerator: (req) => {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "unknown";

        return `${ipKeyGenerator(req)}:${email}`;
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
    validate: { trustProxy: false },
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
router.post("/create-recruiter", authenticate, authorize("recruiter"), createRecruiter);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
