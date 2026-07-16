const express = require('express');
const Assessment = require('../models/assessment.model');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Create Assessment (Recruiter Only)
router.post('/', requireAuth, requireRole('recruiter'), async (req, res, next) => {
  try {
    const { title, description, durationMinutes, questions, startTime, endTime } = req.body;
    
    // Securely tie to current authenticated recruiter's ID to prevent ID spoofing
    const creatorId = req.user.id || req.user._id;

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
      isActive: false // Starts inactive (not live)
    });

    res.status(201).json({
      success: true,
      assessment: newAssessment
    });
  } catch (err) {
    next(err);
  }
});

// Make Assessment Live / Toggle Active (Recruiter Only)
router.put('/:id/make-live', requireAuth, requireRole('recruiter'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    assessment.isActive = true;
    await assessment.save();

    // Real-time broadcast using Socket.io when assessment goes live
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

// Get Assessments (Authenticated)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let query = {};
    
    // Candidates can only see live (active) assessments
    if (req.user.role === 'candidate') {
      query.isActive = true;
    } else if (req.user.role === 'recruiter') {
      // Recruiters see their own assessments, or all assessments
      query.createdBy = req.user.id || req.user._id;
    }

    const assessments = await Assessment.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      assessments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

