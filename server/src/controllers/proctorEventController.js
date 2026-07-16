/**
 * proctorEventController.js
 *
 * Canonical implementation for recording proctoring events.
 * Events are stored in the standalone ProctorEvent collection (not
 * embedded in Submission.proctorLog, which has been removed).
 *
 * Guards applied, in order:
 *  1. Zod schema validation  – rejects unknown / invalid eventType early.
 *  2. Submission existence   – 404 if the submission doesn't exist.
 *  3. Ownership (IDOR)       – candidate must own this submission.
 *  4. Status check           – can only log events for in-progress exams;
 *                              prevents backdating / post-hoc injection.
 *  5. In-memory rate-limit   – throttles to one event per second per
 *                              submission so the route can't be DDoSed
 *                              or used to flood the integrity record.
 *                              NOTE: single-process guard only; replace
 *                              with Redis if horizontally scaling.
 */

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

// Simple in-memory rate-limit: submissionId -> timestamp of last accepted event.
// Good enough for single-process deployments; swap for Redis when scaling out.
const lastEventAt = new Map();
const MIN_EVENT_INTERVAL_MS = 1_000; // reject events arriving < 1 s apart

const createProctorEvent = async (req, res) => {
  // 1. Validate request body before touching the DB.
  const parsed = proctorEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid proctor event payload",
    });
  }

  try {
    // 2. Fetch the submission. Only select fields needed for the guards.
    const submission = await Submission.findById(req.params.id).select(
      "candidateId status",
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // 3. Ownership (IDOR) check — the candidate must own this submission.
    //    req.user is set by the authenticate middleware upstream.
    if (String(submission.candidateId) !== String(req.user.id || req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // 4. Status check — reject events for exams that are no longer in progress.
    //    This prevents an attacker (or a malicious candidate) from injecting
    //    fake events after the exam has been submitted / evaluated.
    if (submission.status !== "in_progress") {
      return res.status(409).json({
        success: false,
        message: "Submission is not in progress",
      });
    }

    // 5. Rate-limit guard — this route fires frequently by design (every tab
    //    switch, every paste), but we don't want it spammable into a DoS
    //    vector or used to flood the log and skew risk scoring.
    const key = String(submission._id);
    const now = Date.now();
    const last = lastEventAt.get(key) || 0;
    if (now - last < MIN_EVENT_INTERVAL_MS) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, slow down",
      });
    }
    lastEventAt.set(key, now);

    // 6. Persist the event. Deliberately ignore any client-sent timestamp —
    //    the schema default (Date.now) stamps it server-side so a malicious
    //    client can't backdate or forge when something happened.
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
