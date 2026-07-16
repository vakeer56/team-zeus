const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Unauthorized");
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || typeof decoded !== "object") {
            throw new ApiError(401, "Unauthorized");
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }

        if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = authenticate;

// test comment
