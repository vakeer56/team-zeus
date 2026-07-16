const Submission = require("../models/submission.model");
const Assessment = require("../models/assessment.model");
const { ProctorEvent } = require("../models/proctorEvent.model");
const User = require("../models/user.model");

// Start a new test submission (Candidate Only)
exports.startSubmission = async (req, res, next) => {
  try {
    const { assessmentId } = req.body;
    const candidateId = req.user.id || req.user._id;

    if (!assessmentId) {
      return res.status(400).json({ success: false, message: "assessmentId is required" });
    }

    // Check if assessment exists and is active (live)
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }
    if (assessment.status !== "published") {
      return res.status(403).json({ success: false, message: "This assessment is not live yet" });
    }

    // Check if candidate already has a submission for this test
    let submission = await Submission.findOne({ candidateId, assessmentId });
    if (submission) {
      // Resume existing submission
      return res.status(200).json({
        success: true,
        message: "Resuming existing assessment session",
        submission
      });
    }

    // Create a new submission
    submission = await Submission.create({
      candidateId,
      assessmentId,
      status: "in_progress",
      answers: [],
      startedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Assessment session started",
      submission
    });
  } catch (err) {
    next(err);
  }
};

// Update submission with answers and final grade
exports.updateSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, totalScore, status, aiReport } = req.body;
    const userId = req.user.id || req.user._id;

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Security: Only the candidate who owns the submission can update it
    if (submission.candidateId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized submission access" });
    }

    if (answers) submission.answers = answers;
    if (totalScore !== undefined) submission.totalScore = totalScore;
    if (status) submission.status = status;
    if (aiReport) submission.aiReport = aiReport;
    
    if (status === "submitted" || status === "evaluated") {
      submission.submittedAt = new Date();
    }

    await submission.save();

    // Emit Socket.io event to notify Recruiter Dashboard in real time
    const io = req.app.get('io');
    if (io) {
      io.emit('submission_updated', submission);
    }

    res.status(200).json({
      success: true,
      message: "Submission updated successfully",
      submission
    });
  } catch (err) {
    next(err);
  }
};

// Get all submissions (Recruiters see all, candidates see their own)
exports.getSubmissions = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    let query = {};

    if (req.user.role === 'candidate') {
      query.candidateId = userId;
    } else if (req.user.role === 'recruiter') {
      const { assessmentId } = req.query;
      if (assessmentId) {
        query.assessmentId = assessmentId;
      }
    }

    const submissions = await Submission.find(query)
      .populate("candidateId", "name email")
      .populate("assessmentId", "title durationMinutes")
      .sort({ createdAt: -1 });

     // Fetch proctor events and calculate security violations for each submission
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (sub) => {
        const events = await ProctorEvent.find({ submissionId: sub._id });
        
        // Calculate dynamic risk score based on proctor events
        let copyPasteCount = events.filter(e => ['copy_attempt', 'paste_attempt', 'right_click'].includes(e.eventType)).length;
        let tabSwitchCount = events.filter(e => e.eventType === 'tab_switch').length;
        let windowBlurCount = events.filter(e => e.eventType === 'window_blur').length;
        let fullscreenExitCount = events.filter(e => e.eventType === 'fullscreen_exit').length;
        let devToolsCount = events.filter(e => e.eventType === 'suspicious_activity').length;

        let calculatedRisk = (copyPasteCount * 5) + (tabSwitchCount * 30) + (windowBlurCount * 30) + (fullscreenExitCount * 30) + (devToolsCount * 30);
        calculatedRisk = Math.min(100, calculatedRisk);

        const obj = sub.toObject();
        obj.proctorEvents = events;
        if (!obj.aiReport) {
          obj.aiReport = {};
        }
        obj.aiReport.riskScore = calculatedRisk;
        return obj;
      })
    );

    res.status(200).json({
      success: true,
      submissions: enrichedSubmissions
    });
  } catch (err) {
    next(err);
  }
};

// Get single submission details
exports.getSubmissionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const submission = await Submission.findById(id)
      .populate("candidateId", "name email")
      .populate("assessmentId", "title durationMinutes questions");

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Security check: recruiter or owner can view
    if (req.user.role !== 'recruiter' && submission.candidateId._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to submission details" });
    }

    const events = await ProctorEvent.find({ submissionId: submission._id }).sort({ createdAt: 1 });
    
    // Calculate dynamic risk score
    let copyPasteCount = events.filter(e => ['copy_attempt', 'paste_attempt', 'right_click'].includes(e.eventType)).length;
    let tabSwitchCount = events.filter(e => e.eventType === 'tab_switch').length;
    let windowBlurCount = events.filter(e => e.eventType === 'window_blur').length;
    let fullscreenExitCount = events.filter(e => e.eventType === 'fullscreen_exit').length;
    let devToolsCount = events.filter(e => e.eventType === 'suspicious_activity').length;

    let calculatedRisk = (copyPasteCount * 5) + (tabSwitchCount * 30) + (windowBlurCount * 30) + (fullscreenExitCount * 30) + (devToolsCount * 30);
    calculatedRisk = Math.min(100, calculatedRisk);

    const submissionObj = submission.toObject();
    submissionObj.proctorEvents = events;
    if (!submissionObj.aiReport) {
      submissionObj.aiReport = {};
    }
    submissionObj.aiReport.riskScore = calculatedRisk;

    res.status(200).json({
      success: true,
      submission: submissionObj
    });
  } catch (err) {
    next(err);
  }
};

// Reauthorize candidate (Delete submission and proctor events so they can restart clean)
exports.reauthorizeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Delete all proctor events
    await ProctorEvent.deleteMany({ submissionId: id });
    // Delete the submission
    await Submission.findByIdAndDelete(id);

    // Emit Socket.io update
    const io = req.app.get('io');
    if (io) {
      io.emit('submission_updated');
    }

    res.status(200).json({
      success: true,
      message: "Candidate re-authorized successfully. Previous session reset."
    });
  } catch (err) {
    next(err);
  }
};
