const express = require("express");
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

router.post(
    "/assessments",
    authenticate,
    authorize("admin"),
    validateRequestBody(createAssessmentSchema),
    createAssessment,
);

router.get("/assessments", authenticate, getAssessments);
router.get("/assessments/:id", authenticate, getAssessmentById);
router.put(
    "/assessments/:id",
    authenticate,
    authorize("admin"),
    validateRequestBody(updateAssessmentSchema),
    updateAssessment,
);
router.delete(
    "/assessments/:id",
    authenticate,
    authorize("admin"),
    deleteAssessment,
);

module.exports = router;
