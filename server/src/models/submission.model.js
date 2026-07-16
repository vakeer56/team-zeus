// models/Submission.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: { type: String, default: '' },   // MCQ option OR Python code as plain string
  isCorrect: { type: Boolean, default: false },
  scoreAwarded: { type: Number, default: 0 },
  executionResult: {
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    compileOutput: { type: String, default: '' },   // Wandbox returns compiler_error/
                                                       // compiler_output separately from
                                                       // program_output/program_error;
                                                       // map compiler-stage output here
    verdict: {
      type: String,
      enum: ['pending', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'compile_error'],
      default: 'pending'
      // 'compile_error' repurposed to mean "syntax error" for Python —
      // Wandbox still reports a nonzero status for this case
    }
  }
}, { _id: false });

const proctorEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab_switch', 'window_blur', 'paste', 'copy', 'right_click', 'fullscreen_exit'],
    required: true
  },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const riskFlagSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  count: { type: Number, required: true },
  weight: { type: Number, required: true }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
  proctorLog: { events: [proctorEventSchema] },
  aiReport: {
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    flags: [riskFlagSchema],
    computedAt: { type: Date }
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluated', 'pending_reevaluation'],
    default: 'in_progress'
  },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date }
}, { timestamps: true });

submissionSchema.index({ candidateId: 1, assessmentId: 1 }, { unique: true });
submissionSchema.index({ assessmentId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);