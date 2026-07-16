// scripts/seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Assessment = require("../models/assessment.model");
const Submission = require("../models/submission.model");
require("dotenv").config();

async function seed() {
  await mongoose.connect(process.env.DB_URL);

  // Clean slate for repeatable testing
  await User.deleteMany({ email: /test|evalix/ });
  await Submission.deleteMany({});
  await Assessment.deleteMany({});

  const hashedPassword = await bcrypt.hash("password123", 10);

  const candidate = await User.create({
    name: "Test Candidate",
    email: "candidate@test.com",
    password: hashedPassword,
    role: "candidate",
  });

  const attacker = await User.create({
    name: "Other Candidate",
    email: "attacker@test.com",
    password: hashedPassword,
    role: "candidate",
  });

  const recruiter = await User.create({
    name: "Recruiter Admin",
    email: "recruiter@recruiter.evalix.com",
    password: hashedPassword,
    role: "recruiter",
  });

  const assessment = await Assessment.create({
    title: "Test Assessment",
    createdBy: recruiter._id,
    durationMinutes: 60,
    questions: [
      { type: "mcq", text: "2+2?", marks: 1, options: ["3", "4"], correctOptionIndex: 1 },
    ],
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
  });

  const submission = await Submission.create({
    candidateId: candidate._id,
    assessmentId: assessment._id,
    status: "in_progress",
  });

  console.log("candidateId:", candidate._id.toString());
  console.log("attackerId (wrong owner):", attacker._id.toString());
  console.log("recruiterId:", recruiter._id.toString());
  console.log("submissionId:", submission._id.toString());

  process.exit(0);
}

seed();