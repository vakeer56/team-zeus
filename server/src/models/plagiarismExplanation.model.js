const mongoose = require("mongoose");

const plagiarismExplanationSchema = new mongoose.Schema(
  {
    candidateAId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateBId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    verdict_hint: {
      type: String,
      required: true,
    },
    key_evidence: {
      type: [String],
      default: [],
    },
    differences_noted: {
      type: [String],
      default: [],
    },
    explanation: {
      type: String,
      required: true,
    },
    confidence: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index to ensure caching works correctly
plagiarismExplanationSchema.index({ candidateAId: 1, candidateBId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("PlagiarismExplanation", plagiarismExplanationSchema);
