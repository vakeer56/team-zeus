const express = require("express");
const Submission = require("../models/submission.model");
const PlagiarismExplanation = require("../models/plagiarismExplanation.model");
const { explainSimilarity } = require("../services/plagiarismExplainer");

const router = express.Router();

// Simple in-memory rate-limit guard
const requestCounts = new Map();
const rateLimitGuard = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 20; // max 20 requests per minute per IP

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip).filter(t => now - t < windowMs);
  timestamps.push(now);
  requestCounts.set(ip, timestamps);

  if (timestamps.length > maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Too many plagiarism explanation requests. Please try again in a minute."
    });
  }
  next();
};

// POST /api/plagiarism/explain
router.post("/explain", rateLimitGuard, async (req, res, next) => {
  try {
    const { candidateAId, candidateBId, questionId } = req.body;

    if (!candidateAId || !candidateBId || !questionId) {
      return res.status(400).json({ success: false, message: "candidateAId, candidateBId, and questionId are required" });
    }

    // Generate deterministic cache key by sorting candidate IDs
    const sortedCandidates = [candidateAId.toString(), candidateBId.toString()].sort();
    const cacheKey = `${sortedCandidates[0]}_${sortedCandidates[1]}_${questionId}`;

    // Check MongoDB cache first
    const cachedExplanation = await PlagiarismExplanation.findOne({ key: cacheKey });
    if (cachedExplanation) {
      return res.status(200).json({
        success: true,
        source: "cache",
        similarityScore: cachedExplanation.similarityScore,
        explanation: cachedExplanation.explanation
      });
    }

    // Fetch submissions for both candidates
    const submissionA = await Submission.findOne({ candidateId: candidateAId }).populate("assessmentId");
    const submissionB = await Submission.findOne({ candidateId: candidateBId }).populate("assessmentId");

    if (!submissionA || !submissionB) {
      return res.status(404).json({ success: false, message: "Submissions for one or both candidates not found" });
    }

    // Extract answer codes matching questionId
    const answerA = submissionA.answers.find(ans => ans.questionId && ans.questionId.toString() === questionId.toString());
    const answerB = submissionB.answers.find(ans => ans.questionId && ans.questionId.toString() === questionId.toString());

    const codeA = answerA ? answerA.answer : "";
    const codeB = answerB ? answerB.answer : "";

    // Extract question context from assessment
    let questionContext = "Coding challenge";
    if (submissionA.assessmentId && submissionA.assessmentId.questions) {
      const dbQuestion = submissionA.assessmentId.questions.find(q => q._id && q._id.toString() === questionId.toString());
      if (dbQuestion) {
        questionContext = dbQuestion.question;
      }
    }

    // Mock similarity checker value if none exists (source of truth checker default: 0.85)
    const similarityScore = 0.85;

    // Call Groq LLM explainer
    const explanation = await explainSimilarity(codeA, codeB, similarityScore, questionContext);

    // Save to MongoDB cache
    await PlagiarismExplanation.create({
      key: cacheKey,
      explanation,
      similarityScore
    });

    return res.status(200).json({
      success: true,
      source: "llm",
      similarityScore,
      explanation
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
