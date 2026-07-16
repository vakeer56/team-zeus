const sanitizeAssessment = (assessment, role = "candidate") => {
    if (!assessment) {
        return assessment;
    }

    const toPlainObject = (value) => {
        if (value && typeof value.toObject === "function") {
            return value.toObject();
        }

        return value;
    };

    const sensitiveFields = role === "admin"
        ? ["__v", "createdBy"]
        : ["__v", "createdBy", "correctOptionIndex", "hiddenTestCases"];

    const mongoose = require("mongoose");

    const sanitizeNode = (value) => {
        if (value instanceof mongoose.Types.ObjectId) {
            return value.toString();
        }

        if (Array.isArray(value)) {
            return value.map((item) => sanitizeNode(item));
        }

        if (!value || typeof value !== "object") {
            return value;
        }

        const result = {};

        for (const [key, nestedValue] of Object.entries(value)) {
            if (sensitiveFields.includes(key)) {
                continue;
            }

            if (key === "questions" && Array.isArray(nestedValue)) {
                result[key] = nestedValue.map((question) => sanitizeQuestion(question));
                continue;
            }

            result[key] = sanitizeNode(nestedValue);
        }

        return result;
    };

    const sanitizeQuestion = (question) => {
        const sanitizedQuestion = sanitizeNode(question);

        if (role !== "admin" && sanitizedQuestion.type !== "CODE") {
            delete sanitizedQuestion.sampleTestCases;
        }

        return sanitizedQuestion;
    };

    return sanitizeNode(toPlainObject(assessment));
};

module.exports = sanitizeAssessment;
