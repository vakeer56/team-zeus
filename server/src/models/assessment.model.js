const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
    {
        input: { type: String, required: true, trim: true },
        expectedOutput: { type: String, required: true, trim: true },
    },
    { _id: true },
);

const questionSchema = new mongoose.Schema(
    {
        question: { type: String, required: true, trim: true },
        type: { type: String, enum: ["MCQ", "CODE"], required: true },
        marks: { type: Number, required: true, default: 1, min: 1 },
        options: { type: [String], default: undefined },
        correctOptionIndex: { type: Number, default: undefined },
        starterCode: { type: String, default: undefined },
        language: { type: String, trim: true, default: undefined },
        sampleTestCases: { type: [testCaseSchema], default: undefined },
        hiddenTestCases: { type: [testCaseSchema], default: undefined },
    },
    { _id: true },
);

const assessmentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        duration: { type: Number, required: true, min: 1 },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
        status: { type: String, enum: ["draft", "published", "archived"], required: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        questions: {
            type: [questionSchema],
            required: true,
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: "At least one question is required",
            },
        },
    },
    { timestamps: true },
);

assessmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
