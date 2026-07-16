const mongoose = require("mongoose");

const plagiarismSimilaritySchema = new mongoose.Schema(
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
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchedLineRanges: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true }
);

// Unique index to enforce single similarity record per pair per question
plagiarismSimilaritySchema.index({ candidateAId: 1, candidateBId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("PlagiarismSimilarity", plagiarismSimilaritySchema);
