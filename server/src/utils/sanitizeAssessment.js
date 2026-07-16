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

    const sanitizeNode = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => sanitizeNode(item));
        }

        if (!value || typeof value !== "object") {
            return value;
        }

        const result = {};

        for (const [key, nestedValue] of Object.entries(value)) {
            if (["__v", "createdBy", "correctOptionIndex", "hiddenTestCases"].includes(key)) {
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

        if (sanitizedQuestion.type !== "CODE") {
            delete sanitizedQuestion.sampleTestCases;
        }

        return sanitizedQuestion;
    };

    if (role === "admin") {
        return toPlainObject(assessment);
    }

    return sanitizeNode(toPlainObject(assessment));
};

module.exports = sanitizeAssessment;
