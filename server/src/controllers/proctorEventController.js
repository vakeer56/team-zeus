const { z } = require("zod");
const Submission = require("../models/submission.model");
const {
  ProctorEvent,
  PROCTOR_EVENT_TYPES,
} = require("../models/proctorEvent.model");

const proctorEventSchema = z.object({
  eventType: z.enum(PROCTOR_EVENT_TYPES),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createProctorEvent = async (req, res) => {
  const parsed = proctorEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid proctor event payload",
    });
  }

  try {
    const submission = await Submission.findById(req.params.id).select("candidateId");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Candidates may record events only for their own active submission.
    if (String(submission.candidateId) !== String(req.user.id || req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // This high-frequency endpoint intentionally performs only validation,
    // authorization, and one insert. Risk-score generation happens elsewhere.
    await ProctorEvent.create({
      submissionId: submission._id,
      candidateId: submission.candidateId,
      eventType: parsed.data.eventType,
      metadata: parsed.data.metadata || {},
    });

    return res.status(201).json({
      success: true,
      message: "Proctor event recorded",
    });
  } catch (_err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { createProctorEvent, proctorEventSchema };
