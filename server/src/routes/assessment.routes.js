const express = require('express');
const Assessment = require('../models/assessment.model');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Create Assessment (Recruiter/Admin Only)
router.post('/', async (req, res, next) => {
  try {
    const { title, description, durationMinutes, questions, startTime, endTime, createdBy } = req.body;
    
    // Fallback creator ID if not authenticated
    const creatorId = createdBy || "6a588dfb315654fbef121e04";

    const newAssessment = await Assessment.create({
      title,
      description: description || '',
      createdBy: creatorId,
      durationMinutes: durationMinutes || 60,
      questions: questions || [
        { type: "mcq", text: "2+2?", marks: 1, options: ["3", "4"], correctOptionIndex: 1 }
      ],
      startTime: startTime || new Date(),
      endTime: endTime || new Date(Date.now() + 3600 * 1000 * 24), // 24 hours from now
      isActive: true
    });

    // Real-time broadcast using Socket.io when assessment goes live
    const io = req.app.get('io');
    if (io) {
      io.emit('assessment_created', newAssessment);
    }

    res.status(201).json({
      success: true,
      assessment: newAssessment
    });
  } catch (err) {
    next(err);
  }
});

// Toggle Active / Make Live
router.put('/:id/make-live', async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    assessment.isActive = true;
    await assessment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('assessment_created', assessment);
    }

    res.status(200).json({
      success: true,
      message: "Assessment is now live!",
      assessment
    });
  } catch (err) {
    next(err);
  }
});

// Get all Assessments
router.get('/', async (req, res, next) => {
  try {
    const assessments = await Assessment.find({
      $or: [
        { status: "published" },
        { isActive: true }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      assessments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
