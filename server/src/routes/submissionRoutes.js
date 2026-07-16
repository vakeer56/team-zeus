const express = require("express");
const router = express.Router();
const { getAiReport } = require("../controllers/aiReportController");
const { requireAuth } = require("../middleware/auth");

router.get("/:id/ai-report", requireAuth, getAiReport);

module.exports = router;
