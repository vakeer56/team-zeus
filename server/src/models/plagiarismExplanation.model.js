const mongoose = require("mongoose");

const plagiarismExplanationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // formatted as: `candidateMinId_candidateMaxId_questionId`
    explanation: { type: mongoose.Schema.Types.Mixed, required: true },
    similarityScore: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlagiarismExplanation", plagiarismExplanationSchema);
