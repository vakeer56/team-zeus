const rateLimit = require("express-rate-limit");

// Login limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});

// Register limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many registrations. Try again later."
    }
});

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30
});

module.exports = {
    loginLimiter,
    registerLimiter,
    apiLimiter
};