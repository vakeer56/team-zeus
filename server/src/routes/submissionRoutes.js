const express = require("express");
const router = express.Router();
const { getAiReport, generateAiReport } = require("../controllers/aiReportController");
const { requireAuth } = require("../middleware/auth");

router.get("/:id/ai-report", requireAuth, getAiReport);
router.post("/:id/ai-report/generate", requireAuth, generateAiReport);

module.exports = router;
