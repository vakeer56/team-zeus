// scripts/seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Assessment = require("../models/assessment.model");
const Submission = require("../models/submission.model");
require("dotenv").config();

// ─── Safety guard ──────────────────────────────────────────────────────────────
// Why this guard exists:
//   seed() calls deleteMany() on Users, Submissions, and Assessments.
//   Running it against a production database would cause irreversible data loss.
//   We therefore enforce that the resolved connection string's database name
//   ends with a clearly non-production suffix ("-dev" or "-test") before a
//   single byte is deleted.
//
// Priority order for the connection string:
//   1. SEED_DB_URL   – dedicated seed/test DB; always preferred.
//   2. DB_URL        – only accepted as a fallback when NODE_ENV === 'development',
//                      and only if the database name still passes the suffix check.
//
// If you need to seed a staging environment, set SEED_DB_URL explicitly to a
// staging connection string whose DB name ends with "-dev" or "-test".
// ──────────────────────────────────────────────────────────────────────────────

const SAFE_DB_SUFFIXES = ["-dev", "-test"];

function resolveConnectionString() {
  if (process.env.SEED_DB_URL) {
    return process.env.SEED_DB_URL;
  }

  if (process.env.NODE_ENV === "development" && process.env.DB_URL) {
    console.warn(
      "[seed] SEED_DB_URL is not set; falling back to DB_URL because NODE_ENV=development.",
    );
    return process.env.DB_URL;
  }

  throw new Error(
    "[seed] No safe connection string found. " +
      "Set SEED_DB_URL to a dedicated seed/test database URL, " +
      "or set NODE_ENV=development to allow falling back to DB_URL.",
  );
}

function assertSafeDatabase(connectionString) {
  // Extract the database name from the MongoDB URI.
  // A MongoDB URI looks like: mongodb://host/dbName?options
  // or mongodb+srv://host/dbName?options
  let dbName;
  try {
    // Remove the query string, then grab the last path segment.
    const withoutQuery = connectionString.split("?")[0];
    dbName = withoutQuery.split("/").pop();
  } catch {
    dbName = "";
  }

  if (!dbName) {
    throw new Error(
      "[seed] Could not determine the database name from the connection string. " +
        "Refusing to run to avoid accidental data loss.",
    );
  }

  const isSafe = SAFE_DB_SUFFIXES.some((suffix) => dbName.endsWith(suffix));
  if (!isSafe) {
    throw new Error(
      `[seed] UNSAFE DATABASE: "${dbName}" does not end with one of ${JSON.stringify(SAFE_DB_SUFFIXES)}. ` +
        "Refusing to run seed against what looks like a production database. " +
        "Rename the database or set SEED_DB_URL to a safe test/dev DB.",
    );
  }
}

async function seed() {
  const connectionString = resolveConnectionString();
  assertSafeDatabase(connectionString);

  await mongoose.connect(connectionString);

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

seed().catch((err) => {
  console.error("[seed] Fatal error:", err.message);
  process.exit(1);
});