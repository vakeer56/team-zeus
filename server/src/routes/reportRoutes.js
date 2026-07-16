const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { getReport, generateReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/submissions/:id", authenticate, getReport);
router.post("/submissions/:id/generate", authenticate, generateReport);

module.exports = router;
