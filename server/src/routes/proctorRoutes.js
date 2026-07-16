const express = require("express");
const { createProctorEvent } = require("../controllers/proctorEventController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/submissions/:id/proctor-event",
  requireAuth,
  requireRole("candidate"),
  createProctorEvent,
);

module.exports = router;
