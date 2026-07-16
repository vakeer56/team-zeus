const mongoose = require("mongoose");

const PROCTOR_EVENT_TYPES = [
  "tab_switch",
  "window_blur",
  "paste_attempt",
  "copy_attempt",
  "fullscreen_exit",
  "multiple_faces_detected",
  "suspicious_activity",
];

const proctorEventSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: {
      type: String,
      enum: PROCTOR_EVENT_TYPES,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false },
);

proctorEventSchema.index({ submissionId: 1, createdAt: -1 });

const ProctorEvent = mongoose.model("ProctorEvent", proctorEventSchema);

module.exports = { ProctorEvent, PROCTOR_EVENT_TYPES };
