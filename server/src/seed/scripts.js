// scripts/seed.js
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Assessment = require("../models/assessment.model");
const Submission = require("../models/submission.model");
require("dotenv").config();

async function seed() {
  await mongoose.connect(process.env.DB_URL);

  // Clean slate for repeatable testing
  await User.deleteMany({ email: /test/ });
  await Submission.deleteMany({});
  await Assessment.deleteMany({});

  const candidate = await User.create({
    name: "Test Candidate",
    email: "candidate@test.com",
    password: "dummyhash", // not used for login yet, so plaintext is fine for now
    role: "candidate",
  });

  const attacker = await User.create({
    name: "Other Candidate",
    email: "attacker@test.com",
    password: "dummyhash",
    role: "candidate",
  });

  const admin = await User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "dummyhash",
    role: "admin",
  });

  const assessment = await Assessment.create({
    title: "Test Assessment",
    createdBy: admin._id,
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
  console.log("adminId:", admin._id.toString());
  console.log("submissionId:", submission._id.toString());

  process.exit(0);
}

seed();