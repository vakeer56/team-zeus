// models/Assessment.js
const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: true },
);

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["mcq", "coding"], required: true },
    text: { type: String, required: true },
    marks: { type: Number, required: true, default: 1, min: 0 },

    // MCQ-only fields
    options: {
      type: [String],
      validate: {
        validator: function (v) {
          return this.type !== "mcq" || (v && v.length >= 2);
        },
        message: "MCQ questions need at least 2 options",
      },
    },
    correctOptionIndex: { type: Number },

    // Coding-only fields
    starterCode: {
      type: String,
      default: "def solve():\n    pass\n", // Python-style stub instead of C++
    },
    language: {
      type: String,
      enum: ["python"], // locked to python only — no multi-language handling needed
      default: "python",
    },
    compilerName: {
      type: String,
      default: "cpython-3.11.1", // Wandbox compiler identifier — VERIFY against
      // GET https://wandbox.org/api/list.json before relying on this
    },
    testCases: [testCaseSchema],
  },
  { _id: true },
);

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    durationMinutes: { type: Number, required: true, min: 1 },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "Assessment must have at least one question",
      },
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
