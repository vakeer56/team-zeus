// controllers/proctorController.js

const Submission = require("../models/submission.model");

// Keep enum values in one place so validation and schema never drift apart
const VALID_EVENT_TYPES = [
  "tab_switch",
  "window_blur",
  "paste",
  "copy",
  "right_click",
  "fullscreen_exit",
];

// Simple in-memory rate-limit guard: submissionId -> last event timestamp
// Good enough for hackathon scope (single process). If you scale to multiple
// server instances later, this needs Redis instead — noting as a known limitation.
const lastEventAt = new Map();
const MIN_EVENT_INTERVAL_MS = 1000; // reject if same submission posts <1s apart

exports.logProctorEvent = async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { type } = req.body;

    // 1. Validate input shape BEFORE touching the DB — cheap to check,
    //    and stops garbage from ever reaching Mongoose's own validation
    //    (which would otherwise throw an uglier error we'd have to catch anyway).
    if (!type || !VALID_EVENT_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing event type" });
    }

    // 2. Fetch the submission. Don't trust the URL param alone — this is the
    //    exact IDOR opportunity an attacking team will try first.
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // 3. Ownership check — the candidate must own this submission.
    //    req.user is assumed populated by auth middleware upstream.
    if (submission.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // 4. Business-logic check — can't log proctor events on an exam that's
    //    already submitted/evaluated. Prevents an attacker (or a malicious
    //    candidate) from injecting fake events after the fact to mess with
    //    their own or someone else's integrity record post-hoc.
    if (submission.status !== "in_progress") {
      return res
        .status(409)
        .json({ error: "Submission is not in progress" });
    }

    // 5. Lightweight rate-limit — this route fires frequently by design
    //    (every tab switch, every paste), but we don't want it spammable
    //    into a DoS vector or used to flood the log to skew risk scoring.
    const key = submissionId;
    const now = Date.now();
    const last = lastEventAt.get(key) || 0;
    if (now - last < MIN_EVENT_INTERVAL_MS) {
      return res.status(429).json({ error: "Too many requests, slow down" });
    }
    lastEventAt.set(key, now);

    // 6. Push the event. Deliberately IGNORE any client-sent timestamp —
    //    Mongoose's schema default (Date.now) stamps it server-side so a
    //    malicious client can't backdate/forge when something happened.
    submission.proctorLog.events.push({ type });
    await submission.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    // Never leak err.stack or raw Mongoose errors to the client —
    // that's free recon for an attacking team.
    console.error("proctor-event error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};