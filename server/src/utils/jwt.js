const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    // Refresh token flow is not implemented yet.
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });
};

module.exports = {
    generateToken,
};
