const mongoose = require("mongoose");
const Assessment = require("../models/assessment.model");
const sanitizeAssessment = require("../utils/sanitizeAssessment");
const ApiError = require("../utils/ApiError");
const { createAssessmentSchema, updateAssessmentSchema } = require("../validators/assessment.schema");

const toPlainObject = (doc) => {
    if (!doc) {
        return doc;
    }

    if (typeof doc.toObject === "function") {
        return doc.toObject();
    }

    return doc;
};

const validateObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid assessment id");
    }

    return id;
};

const buildAssessmentPayload = (body, userId) => ({
    title: body.title,
    description: body.description,
    duration: body.duration,
    difficulty: body.difficulty,
    status: body.status,
    questions: body.questions,
    createdBy: userId,
});

const buildUpdatePayload = (body) => {
    const allowedFields = ["title", "description", "duration", "difficulty", "status", "questions"];
    const updatePayload = {};

    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            updatePayload[field] = body[field];
        }
    }

    return updatePayload;
};

const createAssessment = async (req, res) => {
    try {
        const payload = buildAssessmentPayload(req.validatedBody, req.user.id);
        const assessment = await Assessment.create(payload);

        res.status(201).json({
            success: true,
            data: sanitizeAssessment(assessment, req.user.role),
        });
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getAssessments = async (req, res) => {
    try {
        const query = ["admin", "recruiter"].includes(req.user.role) ? {} : { status: "published" };
        const assessments = await Assessment.find(query).sort({ createdAt: -1 });
        const data = assessments.map((assessment) => sanitizeAssessment(toPlainObject(assessment), req.user.role));

        res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getAssessmentById = async (req, res) => {
    try {
        const assessmentId = validateObjectId(req.params.id);
        const query = ["admin", "recruiter"].includes(req.user.role) ? { _id: assessmentId } : { _id: assessmentId, status: "published" };
        const assessment = await Assessment.findOne(query);

        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        res.status(200).json({
            success: true,
            data: sanitizeAssessment(toPlainObject(assessment), req.user.role),
        });
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateAssessment = async (req, res) => {
    try {
        const assessmentId = validateObjectId(req.params.id);
        const updatePayload = buildUpdatePayload(req.validatedBody);

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update" });
        }

        const assessment = await Assessment.findByIdAndUpdate(assessmentId, updatePayload, {
            new: true,
            runValidators: true,
        });

        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        res.status(200).json({
            success: true,
            data: sanitizeAssessment(toPlainObject(assessment), req.user.role),
        });
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteAssessment = async (req, res) => {
    try {
        const assessmentId = validateObjectId(req.params.id);
        const assessment = await Assessment.findByIdAndDelete(assessmentId);

        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        res.status(204).send();
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createAssessment,
    getAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    createAssessmentSchema,
    updateAssessmentSchema,
};
