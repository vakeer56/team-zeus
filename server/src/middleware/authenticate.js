/**
 * src/middleware/authenticate.js
 *
 * Canonical JWT-verification middleware for the entire application.
 * All route files must import from here — the old auth.js and the
 * inline copy inside auth.routes.js have been removed.
 *
 * Exports
 * ───────
 *  authenticate          – verifies the Bearer token, sets req.user,
 *                          and forwards errors to the global error handler
 *                          via next(err) so that no route file needs to
 *                          handle auth error shapes itself.
 *  authorize(...roles)   – RBAC guard; must come after authenticate.
 */

const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

/**
 * Verify the Authorization: Bearer <token> header.
 * On success: sets req.user = decoded payload and calls next().
 * On failure: calls next(err) with an ApiError so the global error
 *             handler in src/app.js sends the response consistently.
 */
const authenticate = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new ApiError(401, "Unauthorized"));
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || typeof decoded !== "object") {
            return next(new ApiError(401, "Unauthorized"));
        }

        req.user = decoded;
        return next();
    } catch (err) {
        console.log(err);
        return next(new ApiError(401, "Unauthorized"));
    }
};

/**
 * Role-based access control guard.
 * Must be placed after authenticate in the middleware chain.
 *
 * @param  {...string} roles  – allowed roles, e.g. authorize("admin")
 */
const authorize = (...roles) => (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return next(new ApiError(403, "Forbidden"));
    }
    return next();
};

module.exports = { authenticate, authorize };
