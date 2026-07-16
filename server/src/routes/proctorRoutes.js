const express = require("express");
const { createProctorEvent } = require("../controllers/proctorEventController");
const { authenticate, authorize } = require("../middleware/authenticate");

const router = express.Router();

router.post(
  "/submissions/:id/proctor-event",
  authenticate,
  authorize("candidate"),
  createProctorEvent,
);

module.exports = router;
