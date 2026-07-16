const express = require("express");
const router = express.Router();
const { getAiReport, generateAiReport } = require("../controllers/aiReportController");
const {
    startSubmission,
    updateSubmission,
    getSubmissions,
    getSubmissionDetails,
} = require("../controllers/submissionController");
const { authenticate } = require("../middleware/authenticate");

// List all submissions (recruiter or own)
router.get("/", authenticate, getSubmissions);

// Start a new submission
router.post("/", authenticate, startSubmission);

// View single submission detail
router.get("/:id", authenticate, getSubmissionDetails);

// Update answers / submit assessment
router.put("/:id", authenticate, updateSubmission);

// AI report routes
router.get("/:id/ai-report", authenticate, getAiReport);
router.post("/:id/ai-report/generate", authenticate, generateAiReport);

module.exports = router;
