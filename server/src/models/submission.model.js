// models/Submission.js
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    answer: { type: String, default: "" }, // MCQ option OR Python code as plain string
    isCorrect: { type: Boolean, default: false },
    scoreAwarded: { type: Number, default: 0 },
    executionResult: {
      stdout: { type: String, default: "" },
      stderr: { type: String, default: "" },
      compileOutput: { type: String, default: "" }, // Wandbox returns compiler_error/
      // compiler_output separately from
      // program_output/program_error;
      // map compiler-stage output here
      verdict: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "wrong_answer",
          "runtime_error",
          "time_limit_exceeded",
          "compile_error",
        ],
        default: "pending",
        // 'compile_error' repurposed to mean "syntax error" for Python —
        // Wandbox still reports a nonzero status for this case
      },
    },
  },
  { _id: false },
);


const riskFlagSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true },
    severity: { type: String, required: true },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    answers: [answerSchema],
    totalScore: { type: Number, default: 0 },
    aiReport: {
      riskScore: { type: Number, default: 0, min: 0, max: 100 },
      flags: [riskFlagSchema],
      generatedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated", "pending_reevaluation"],
      default: "in_progress",
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true },
);

submissionSchema.index({ candidateId: 1, assessmentId: 1 }, { unique: true });
submissionSchema.index({ assessmentId: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
