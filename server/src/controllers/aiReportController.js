const Submission = require("../models/submission.model");

const getAiReport = async (req, res) => {
  try {
    // Candidates cannot inspect their own score or flags, preventing gaming.
    if (!["admin", "recruiter"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const submission = await Submission.findById(req.params.id).select("aiReport");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    return res.status(200).json({
      submissionId: submission._id,
      aiReport: submission.aiReport,
    });
  } catch (_err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { getAiReport };
