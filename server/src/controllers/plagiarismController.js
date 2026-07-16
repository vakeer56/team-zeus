const mongoose = require("mongoose");
const Submission = require("../models/submission.model");
const Assessment = require("../models/assessment.model");
const PlagiarismSimilarity = require("../models/plagiarismSimilarity.model");
const PlagiarismExplanation = require("../models/plagiarismExplanation.model");
const { explainSimilarity } = require("../services/plagiarismExplainer");

// In-memory rate limiting map for plagiarism explanation calls (max 10 requests per minute per IP)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

const checkRateLimit = (ip) => {
  const now = Date.now();
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = rateLimits.get(ip);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  limit.count++;
  return true;
};

exports.explainPlagiarism = async (req, res, next) => {
  try {
    // 1. Check rate limits
    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Please wait a minute before requesting another plagiarism explanation."
      });
    }

    const { candidateAId, candidateBId, questionId } = req.body;

    // 2. Validate parameters
    if (!candidateAId || !candidateBId || !questionId) {
      return res.status(400).json({
        success: false,
        message: "candidateAId, candidateBId, and questionId are required."
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(candidateAId) ||
      !mongoose.Types.ObjectId.isValid(candidateBId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidateAId, candidateBId, or questionId format."
      });
    }

    if (candidateAId === candidateBId) {
      return res.status(400).json({
        success: false,
        message: "candidateAId and candidateBId must be different."
      });
    }

    // 3. Fetch similarity score from the similarity checker outputs
    const similarity = await PlagiarismSimilarity.findOne({
      $or: [
        { candidateAId, candidateBId, questionId },
        { candidateAId: candidateBId, candidateBId: candidateAId, questionId }
      ]
    });

    if (!similarity) {
      return res.status(404).json({
        success: false,
        message: "No similarity checker record found for the given candidates and question."
      });
    }

    const similarityScore = similarity.similarityScore;

    // 4. Sort candidate IDs for explanation caching key consistency
    const sortedIds = [candidateAId.toString(), candidateBId.toString()].sort();
    const sortedAId = sortedIds[0];
    const sortedBId = sortedIds[1];

    // 5. Check cache in database
    let explanationRecord = await PlagiarismExplanation.findOne({
      candidateAId: sortedAId,
      candidateBId: sortedBId,
      questionId
    });

    if (explanationRecord) {
      return res.status(200).json({
        success: true,
        similarityScore,
        explanation: {
          verdict_hint: explanationRecord.verdict_hint,
          key_evidence: explanationRecord.key_evidence,
          differences_noted: explanationRecord.differences_noted,
          explanation: explanationRecord.explanation,
          confidence: explanationRecord.confidence
        }
      });
    }

    // 6. Fetch submissions
    const [subA, subB] = await Promise.all([
      Submission.findOne({ candidateId: candidateAId, "answers.questionId": questionId }),
      Submission.findOne({ candidateId: candidateBId, "answers.questionId": questionId })
    ]);

    if (!subA || !subB) {
      return res.status(404).json({
        success: false,
        message: "Submission answer records for one or both candidates could not be found."
      });
    }

    const answerA = subA.answers.find(a => a.questionId.toString() === questionId.toString())?.answer || "";
    const answerB = subB.answers.find(a => a.questionId.toString() === questionId.toString())?.answer || "";

    // 7. Fetch question context
    const assessment = await Assessment.findById(subA.assessmentId);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Associated assessment not found."
      });
    }

    const questionObj = assessment.questions.find(q => q._id.toString() === questionId.toString());
    const questionContext = questionObj ? questionObj.question : "";

    // 8. Generate explanation via service
    const generated = await explainSimilarity(answerA, answerB, similarityScore, questionContext);

    // 9. Cache explanation in database
    explanationRecord = await PlagiarismExplanation.create({
      candidateAId: sortedAId,
      candidateBId: sortedBId,
      questionId,
      verdict_hint: generated.verdict_hint,
      key_evidence: generated.key_evidence,
      differences_noted: generated.differences_noted,
      explanation: generated.explanation,
      confidence: generated.confidence
    });

    return res.status(200).json({
      success: true,
      similarityScore,
      explanation: {
        verdict_hint: explanationRecord.verdict_hint,
        key_evidence: explanationRecord.key_evidence,
        differences_noted: explanationRecord.differences_noted,
        explanation: explanationRecord.explanation,
        confidence: explanationRecord.confidence
      }
    });

  } catch (err) {
    next(err);
  }
};

if (process.env.NODE_ENV === "test") {
  exports._resetRateLimits = () => rateLimits.clear();
}
