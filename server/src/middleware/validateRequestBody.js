const validateRequestBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: result.error.issues.map((issue) => ({
                path: issue.code === "unrecognized_keys"
                    ? issue.keys.join(".")
                    : issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    req.validatedBody = result.data;
    next();
};

module.exports = validateRequestBody;
