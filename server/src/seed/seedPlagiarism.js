/**
 * src/seed/seedPlagiarism.js
 *
 * Seeds two candidates with near-identical code submissions, creates a
 * PlagiarismSimilarity record, calls the AI plagiarism explainer service,
 * and stores the explanation result in the database.
 *
 * Usage:
 *   node src/seed/seedPlagiarism.js
 *
 * Requires:
 *   - DB_URL in .env pointing to a running MongoDB instance
 *   - GROQ_API_KEY in .env for the AI explanation call
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../models/user.model");
const Assessment = require("../models/assessment.model");
const Submission = require("../models/submission.model");
const PlagiarismSimilarity = require("../models/plagiarismSimilarity.model");
const PlagiarismExplanation = require("../models/plagiarismExplanation.model");
const { explainSimilarity } = require("../services/plagiarismExplainer");

// ─── Candidate A's code (the "original") ────────────────────────────────────
const candidateACode = `def fibonacci(n):
    """Return the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1

    prev, curr = 0, 1
    for i in range(2, n + 1):
        prev, curr = curr, prev + curr

    return curr


def is_prime(num):
    """Check whether a number is prime."""
    if num < 2:
        return False
    for i in range(2, int(num ** 0.5) + 1):
        if num % i == 0:
            return False
    return True


def main():
    n = int(input("Enter n: "))
    fib = fibonacci(n)
    print(f"Fibonacci({n}) = {fib}")
    print(f"Is {fib} prime? {is_prime(fib)}")


if __name__ == "__main__":
    main()`;

// ─── Candidate B's code (clearly plagiarised — renamed vars + cosmetic edits) ─
const candidateBCode = `def fib(number):
    """Compute the Fibonacci value at position number."""
    if number <= 0:
        return 0
    elif number == 1:
        return 1

    a, b = 0, 1
    for idx in range(2, number + 1):
        a, b = b, a + b

    return b


def check_prime(val):
    """Return True if val is a prime number."""
    if val < 2:
        return False
    for divisor in range(2, int(val ** 0.5) + 1):
        if val % divisor == 0:
            return False
    return True


def main():
    number = int(input("Enter n: "))
    result = fib(number)
    print(f"Fibonacci({number}) = {result}")
    print(f"Is {result} prime? {check_prime(result)}")


if __name__ == "__main__":
    main()`;

async function seedPlagiarism() {
  // ── 1. Connect to database ──────────────────────────────────────────────
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is not set in .env");
  }

  await mongoose.connect(dbUrl);
  console.log("✅ Connected to database");

  // ── 2. Create users ────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clean up any previous seed data
  await User.deleteMany({ email: { $in: ["candidatea@test.com", "candidateb@test.com", "recruiter-plag@recruiter.evalix.com"] } });

  const candidateA = await User.create({
    name: "Candidate Alice",
    email: "candidatea@test.com",
    password: hashedPassword,
    role: "candidate",
    isVerified: true,
  });
  console.log("👤 Created Candidate A:", candidateA._id.toString());

  const candidateB = await User.create({
    name: "Candidate Bob",
    email: "candidateb@test.com",
    password: hashedPassword,
    role: "candidate",
    isVerified: true,
  });
  console.log("👤 Created Candidate B:", candidateB._id.toString());

  const recruiter = await User.create({
    name: "Plagiarism Reviewer",
    email: "recruiter-plag@recruiter.evalix.com",
    password: hashedPassword,
    role: "recruiter",
    isVerified: true,
  });
  console.log("👤 Created Recruiter:", recruiter._id.toString());

  // ── 3. Create assessment with a CODE question ──────────────────────────
  const assessment = await Assessment.create({
    title: "Plagiarism Test Assessment",
    description: "Assessment to test plagiarism detection between two candidates",
    duration: 60,
    difficulty: "medium",
    status: "published",
    createdBy: recruiter._id,
    questions: [
      {
        question: "Write a Python program that computes the nth Fibonacci number and checks if it is prime.",
        type: "CODE",
        marks: 20,
        starterCode: "def fibonacci(n):\n    pass\n\ndef is_prime(num):\n    pass",
        language: "python",
        sampleTestCases: [
          { input: "6", expectedOutput: "8" },
          { input: "7", expectedOutput: "13" },
        ],
        hiddenTestCases: [
          { input: "10", expectedOutput: "55" },
        ],
      },
    ],
  });
  const questionId = assessment.questions[0]._id;
  console.log("📝 Created Assessment:", assessment._id.toString());
  console.log("❓ Question ID:", questionId.toString());

  // ── 4. Create submissions with near-identical answers ──────────────────
  // Remove any previous submissions for these candidates on this assessment
  await Submission.deleteMany({ candidateId: { $in: [candidateA._id, candidateB._id] } });

  const submissionA = await Submission.create({
    candidateId: candidateA._id,
    assessmentId: assessment._id,
    status: "submitted",
    submittedAt: new Date(),
    totalScore: 20,
    answers: [
      {
        questionId,
        answer: candidateACode,
        isCorrect: true,
        scoreAwarded: 20,
        executionResult: {
          stdout: "Fibonacci(6) = 8\nIs 8 prime? False",
          stderr: "",
          verdict: "accepted",
        },
      },
    ],
  });
  console.log("📄 Created Submission A:", submissionA._id.toString());

  const submissionB = await Submission.create({
    candidateId: candidateB._id,
    assessmentId: assessment._id,
    status: "submitted",
    submittedAt: new Date(),
    totalScore: 20,
    answers: [
      {
        questionId,
        answer: candidateBCode,
        isCorrect: true,
        scoreAwarded: 20,
        executionResult: {
          stdout: "Fibonacci(6) = 8\nIs 8 prime? False",
          stderr: "",
          verdict: "accepted",
        },
      },
    ],
  });
  console.log("📄 Created Submission B:", submissionB._id.toString());

  // ── 5. Create the algorithmic similarity record ────────────────────────
  //    (Simulates the output of the existing similarity checker)
  await PlagiarismSimilarity.deleteMany({ questionId });

  const similarity = await PlagiarismSimilarity.create({
    candidateAId: candidateA._id,
    candidateBId: candidateB._id,
    questionId,
    similarityScore: 92,
    matchedLineRanges: [
      { startA: 1, endA: 12, startB: 1, endB: 12 },
      { startA: 15, endA: 22, startB: 15, endB: 22 },
      { startA: 25, endA: 32, startB: 25, endB: 32 },
    ],
  });
  console.log("\n🔍 Similarity Record Created:");
  console.log("   Score:", similarity.similarityScore, "%");
  console.log("   Matched ranges:", JSON.stringify(similarity.matchedLineRanges));

  // ── 6. Call AI plagiarism explainer ────────────────────────────────────
  console.log("\n🤖 Calling AI Plagiarism Explainer (Groq API)...");

  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️  GROQ_API_KEY is not set — AI explanation will return fallback response");
  }

  const questionContext = assessment.questions[0].question;
  const explanation = await explainSimilarity(
    candidateACode,
    candidateBCode,
    similarity.similarityScore,
    questionContext,
  );

  console.log("\n📊 AI Explanation Result:");
  console.log("   Verdict Hint:", explanation.verdict_hint);
  console.log("   Confidence:", explanation.confidence);
  console.log("   Key Evidence:");
  explanation.key_evidence.forEach((e, i) => console.log(`     ${i + 1}. ${e}`));
  console.log("   Differences Noted:");
  explanation.differences_noted.forEach((d, i) => console.log(`     ${i + 1}. ${d}`));
  console.log("   Explanation:", explanation.explanation);

  // ── 7. Store explanation in database (cache) ───────────────────────────
  await PlagiarismExplanation.deleteMany({ questionId });

  const sortedIds = [candidateA._id.toString(), candidateB._id.toString()].sort();

  const storedExplanation = await PlagiarismExplanation.create({
    candidateAId: sortedIds[0],
    candidateBId: sortedIds[1],
    questionId,
    verdict_hint: explanation.verdict_hint,
    key_evidence: explanation.key_evidence,
    differences_noted: explanation.differences_noted,
    explanation: explanation.explanation,
    confidence: explanation.confidence,
  });

  console.log("\n💾 Explanation Stored in Database:");
  console.log("   Document ID:", storedExplanation._id.toString());
  console.log("   CandidateA (sorted):", storedExplanation.candidateAId.toString());
  console.log("   CandidateB (sorted):", storedExplanation.candidateBId.toString());

  // ── 8. Verify by reading back from DB ──────────────────────────────────
  const verified = await PlagiarismExplanation.findById(storedExplanation._id);
  console.log("\n✅ Verification — Read back from DB:");
  console.log("   Verdict:", verified.verdict_hint);
  console.log("   Confidence:", verified.confidence);
  console.log("   Explanation:", verified.explanation.substring(0, 120) + "...");

  console.log("\n🎉 Plagiarism seed completed successfully!");
  console.log("\n────────────────────────────────────────────");
  console.log("  You can now test the API route with:");
  console.log(`  POST /api/plagiarism/explain`);
  console.log(`  Body: {`);
  console.log(`    "candidateAId": "${candidateA._id}",`);
  console.log(`    "candidateBId": "${candidateB._id}",`);
  console.log(`    "questionId": "${questionId}"`);
  console.log(`  }`);
  console.log("────────────────────────────────────────────\n");

  await mongoose.connection.close();
  process.exit(0);
}

seedPlagiarism().catch((err) => {
  console.error("❌ Seed error:", err.message || err);
  mongoose.connection.close().finally(() => process.exit(1));
});
