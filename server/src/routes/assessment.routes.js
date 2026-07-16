const express = require("express");
const Assessment = require("../models/assessment.model");
const { authenticate, authorize } = require("../middleware/authenticate");
const validateRequestBody = require("../middleware/validateRequestBody");
const {
    createAssessment,
    getAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    createAssessmentSchema,
    updateAssessmentSchema,
} = require("../controllers/assessment.controller");

const router = express.Router();

// Create Assessment
router.post(
    "/assessments",
    authenticate,
    authorize("admin", "recruiter"),
    validateRequestBody(createAssessmentSchema),
    createAssessment
);

// Get Assessments
router.get("/assessments", authenticate, getAssessments);

// Toggle Active / Make Live
router.put('/assessments/:id/make-live', authenticate, authorize("admin", "recruiter"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    const targetStatus = assessment.status === "published" ? "draft" : "published";
    assessment.status = targetStatus;
    await assessment.save();

    // Broadcast Socket.io event if turning live
    if (targetStatus === "published") {
      const io = req.app.get('io');
      if (io) {
        io.emit('assessment_created', assessment);
      }
    }

    res.status(200).json({
      success: true,
      message: targetStatus === "published" ? "Assessment is now live!" : "Assessment is now inactive.",
      assessment
    });
  } catch (err) {
    next(err);
  }
});

router.get("/assessments/:id", authenticate, getAssessmentById);

router.put(
    "/assessments/:id",
    authenticate,
    authorize("admin", "recruiter"),
    validateRequestBody(updateAssessmentSchema),
    updateAssessment
);

router.delete(
    "/assessments/:id",
    authenticate,
    authorize("admin", "recruiter"),
    deleteAssessment
);

module.exports = router;
