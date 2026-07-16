const express = require("express");
const router = express.Router();
const { explainPlagiarism } = require("../controllers/plagiarismController");
const { authenticate, authorize } = require("../middleware/authenticate");

// Explains code similarity between candidate submissions (accessible only to recruiters and admins)
router.post("/explain", authenticate, authorize("recruiter", "admin"), explainPlagiarism);

module.exports = router;
