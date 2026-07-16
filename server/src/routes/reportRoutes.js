const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getReport, generateReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/submissions/:id", requireAuth, getReport);
router.post("/submissions/:id/generate", requireAuth, generateReport);

module.exports = router;
