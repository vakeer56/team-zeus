const Submission = require("../models/submission.model");
const { ProctorEvent } = require("../models/proctorEvent.model");
const { generateAiReport } = require("../services/aiReport.service");

const canReviewReports = (req) => ["admin", "recruiter"].includes(req.user.role);

const getReport = async (req, res) => {
  try {
    if (!canReviewReports(req)) return res.status(403).json({ success: false, message: "Forbidden" });
    const submission = await Submission.findById(req.params.id).select("aiReport");
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    return res.status(200).json({ submissionId: submission._id, aiReport: submission.aiReport });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const generateReport = async (req, res) => {
  try {
    if (!canReviewReports(req)) return res.status(403).json({ success: false, message: "Forbidden" });
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    const events = await ProctorEvent.find({ submissionId: submission._id })
      .select("eventType createdAt")
      .sort({ createdAt: 1 })
      .lean();
    const aiReport = await generateAiReport(events);
    submission.aiReport = aiReport;
    await submission.save();

    return res.status(200).json({ success: true, submissionId: submission._id, aiReport });
  } catch (error) {
    console.error("AI report generation error:", error.message);
    return res.status(502).json({ success: false, message: "Unable to generate AI report" });
  }
};

module.exports = { getReport, generateReport };
