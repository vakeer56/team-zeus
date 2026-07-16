const express = require("express");
const router = express.Router();
const { getAiReport } = require("../controllers/aiReportController");
const { 
  startSubmission, 
  updateSubmission, 
  getSubmissions, 
  getSubmissionDetails 
} = require("../controllers/submissionController");
const { requireAuth } = require("../middleware/auth");

// List all submissions (recruiter or own)
router.get("/", requireAuth, getSubmissions);

// Start a new submission
router.post("/", requireAuth, startSubmission);

// View single submission detail
router.get("/:id", requireAuth, getSubmissionDetails);

// Update answers / submit assessment
router.put("/:id", requireAuth, updateSubmission);

// Legacy AI report route
router.get("/:id/ai-report", requireAuth, getAiReport);

module.exports = router;

