// routes/submissionRoutes.js (relevant slice)

const express = require("express");
const router = express.Router();
const { logProctorEvent } = require("../controllers/proctorController");
const { requireAuth, requireRole } = require("../middleware/auth"); // adjust to your actual middleware names

router.post(
  "/:id/proctor-event",
  requireAuth,                 // populates req.user
  requireRole("candidate"),    // only candidates log their own proctor events
  logProctorEvent
);

module.exports = router;
