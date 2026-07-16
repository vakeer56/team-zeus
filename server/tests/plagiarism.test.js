const request = require("supertest");
const app = require("../src/app");
const Submission = require("../src/models/submission.model");
const PlagiarismSimilarity = require("../src/models/plagiarismSimilarity.model");
const PlagiarismExplanation = require("../src/models/plagiarismExplanation.model");
const { explainSimilarity } = require("../src/services/plagiarismExplainer");
const plagiarismController = require("../src/controllers/plagiarismController");
const {
  createAdmin,
  createCandidate,
  createUser,
  generateJWT,
  authHeader,
  createAssessment,
} = require("./testUtils");

describe("Plagiarism Explanation Feature", () => {
  let admin;
  let recruiter;
  let candidateA;
  let candidateB;
  let assessment;
  let questionId;

  beforeEach(async () => {
    // Clear databases
    await Submission.deleteMany({});
    await PlagiarismSimilarity.deleteMany({});
    await PlagiarismExplanation.deleteMany({});

    // Reset in-memory rate limits between tests
    if (plagiarismController._resetRateLimits) {
      plagiarismController._resetRateLimits();
    }

    // Setup users
    admin = await createAdmin();
    recruiter = await createUser({ role: "recruiter" });
    candidateA = await createCandidate();
    candidateB = await createCandidate();

    // Create assessment with a code question
    assessment = await createAssessment({
      questions: [
        {
          question: "Write a function to return the sum of two numbers.",
          type: "CODE",
          marks: 10,
          starterCode: "def sum(a, b):\n    pass",
          language: "python"
        }
      ]
    }, admin._id);

    questionId = assessment.questions[0]._id;

    // Create submissions with answers
    await Submission.create({
      candidateId: candidateA._id,
      assessmentId: assessment._id,
      status: "submitted",
      answers: [{
        questionId,
        answer: "def sum(a, b):\n    # adding a and b\n    return a + b",
        isCorrect: true,
        scoreAwarded: 10
      }]
    });

    await Submission.create({
      candidateId: candidateB._id,
      assessmentId: assessment._id,
      status: "submitted",
      answers: [{
        questionId,
        answer: "def sum(x, y):\n    # return addition\n    return x + y",
        isCorrect: true,
        scoreAwarded: 10
      }]
    });
  });

  describe("Plagiarism Explainer Service (src/services/plagiarismExplainer)", () => {
    let originalFetch;

    beforeAll(() => {
      originalFetch = globalThis.fetch;
    });

    afterAll(() => {
      globalThis.fetch = originalFetch;
    });

    it("successfully calls Groq API and parses the explanation JSON", async () => {
      process.env.GROQ_API_KEY = "test-groq-key";

      const mockApiResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              verdict_hint: "strong_evidence",
              key_evidence: ["Variable renamed from a,b to x,y", "Structure is identical"],
              differences_noted: ["Comments are different"],
              explanation: "Both solutions use the same one-liner structure with different variable names.",
              confidence: "high"
            })
          }
        }]
      };

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const explanation = await explainSimilarity(
        "def sum(a,b):\n return a+b",
        "def sum(x,y):\n return x+y",
        95,
        "Write a sum function"
      );

      expect(globalThis.fetch).toHaveBeenCalled();
      expect(explanation.verdict_hint).toBe("strong_evidence");
      expect(explanation.confidence).toBe("high");
      expect(explanation.key_evidence).toContain("Structure is identical");
    });

    it("strips markdown json fences before parsing", async () => {
      process.env.GROQ_API_KEY = "test-groq-key";

      const mockApiResponse = {
        choices: [{
          message: {
            content: "```json\n" + JSON.stringify({
              verdict_hint: "suspicious",
              key_evidence: ["Identical code"],
              differences_noted: [],
              explanation: "Matching code",
              confidence: "medium"
            }) + "\n```"
          }
        }]
      };

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const explanation = await explainSimilarity(
        "def sum(a,b): return a+b",
        "def sum(a,b): return a+b",
        100,
        "Write a sum function"
      );

      expect(explanation.verdict_hint).toBe("suspicious");
      expect(explanation.explanation).toBe("Matching code");
    });

    it("returns default fallback object when Groq API fails", async () => {
      process.env.GROQ_API_KEY = "test-groq-key";

      globalThis.fetch = jest.fn().mockRejectedValue(new Error("API timeout"));

      const explanation = await explainSimilarity(
        "def sum(a,b): return a+b",
        "def sum(a,b): return a+b",
        100,
        "Write a sum function"
      );

      expect(explanation.verdict_hint).toBe("inconclusive");
      expect(explanation.confidence).toBe("low");
      expect(explanation.explanation).toContain("Automated explanation unavailable");
    });
  });

  describe("POST /api/plagiarism/explain API Endpoint", () => {
    let originalFetch;

    beforeAll(() => {
      originalFetch = globalThis.fetch;
    });

    afterAll(() => {
      globalThis.fetch = originalFetch;
    });

    beforeEach(async () => {
      // Seed similarity record
      await PlagiarismSimilarity.create({
        candidateAId: candidateA._id,
        candidateBId: candidateB._id,
        questionId,
        similarityScore: 92,
        matchedLineRanges: [{ startA: 1, endA: 3, startB: 1, endB: 3 }]
      });
    });

    it("returns 401 when request is not authenticated", async () => {
      const res = await request(app)
        .post("/api/plagiarism/explain")
        .send({
          candidateAId: candidateA._id,
          candidateBId: candidateB._id,
          questionId
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 403 when candidate attempts to access the route", async () => {
      const token = generateJWT(candidateA);
      const res = await request(app)
        .post("/api/plagiarism/explain")
        .set(authHeader(token))
        .send({
          candidateAId: candidateA._id,
          candidateBId: candidateB._id,
          questionId
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("allows recruiter or admin to explain similarity", async () => {
      process.env.GROQ_API_KEY = "test-groq-key";

      const mockApiResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              verdict_hint: "strong_evidence",
              key_evidence: ["Renamed variable names"],
              differences_noted: [],
              explanation: "Highly similar structural layout",
              confidence: "high"
            })
          }
        }]
      };

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const token = generateJWT(recruiter);
      const res = await request(app)
        .post("/api/plagiarism/explain")
        .set(authHeader(token))
        .send({
          candidateAId: candidateA._id,
          candidateBId: candidateB._id,
          questionId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.similarityScore).toBe(92);
      expect(res.body.explanation.verdict_hint).toBe("strong_evidence");
      expect(res.body.explanation.explanation).toBe("Highly similar structural layout");

      // Verify that explanation has been cached in database
      const cached = await PlagiarismExplanation.findOne({
        questionId
      });
      expect(cached).not.toBeNull();
      expect(cached.explanation).toBe("Highly similar structural layout");
    });

    it("returns cached explanation and does not call LLM again on repeated request", async () => {
      // Setup cached explanation in DB
      const sortedIds = [candidateA._id.toString(), candidateB._id.toString()].sort();
      await PlagiarismExplanation.create({
        candidateAId: sortedIds[0],
        candidateBId: sortedIds[1],
        questionId,
        verdict_hint: "boilerplate_only",
        key_evidence: [],
        differences_noted: [],
        explanation: "This was loaded from cache",
        confidence: "medium"
      });

      globalThis.fetch = jest.fn();

      const token = generateJWT(admin);
      const res = await request(app)
        .post("/api/plagiarism/explain")
        .set(authHeader(token))
        .send({
          candidateAId: candidateA._id,
          candidateBId: candidateB._id,
          questionId
        });

      expect(res.status).toBe(200);
      expect(res.body.explanation.explanation).toBe("This was loaded from cache");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("returns 404 when similarity record is missing", async () => {
      await PlagiarismSimilarity.deleteMany({});

      const token = generateJWT(recruiter);
      const res = await request(app)
        .post("/api/plagiarism/explain")
        .set(authHeader(token))
        .send({
          candidateAId: candidateA._id,
          candidateBId: candidateB._id,
          questionId
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("No similarity checker record found");
    });

    it("enforces in-memory rate limits (max 10 requests)", async () => {
      const token = generateJWT(recruiter);

      // Setup cache so we don't trigger fetch/errors
      const sortedIds = [candidateA._id.toString(), candidateB._id.toString()].sort();
      await PlagiarismExplanation.create({
        candidateAId: sortedIds[0],
        candidateBId: sortedIds[1],
        questionId,
        verdict_hint: "boilerplate_only",
        key_evidence: [],
        differences_noted: [],
        explanation: "Cached",
        confidence: "medium"
      });

      // Fire 10 fast requests
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post("/api/plagiarism/explain")
          .set(authHeader(token))
          .send({
            candidateAId: candidateA._id,
            candidateBId: candidateB._id,
            questionId
          });
        expect(res.status).toBe(200);
      }

      // 11th request must fail with 429
      const res429 = await request(app)
        .post("/api/plagiarism/explain")
        .set(authHeader(token))
        .send({
          candidateAId: candidateA._id,
          candidateBId: candidateB._id,
          questionId
        });

      expect(res429.status).toBe(429);
      expect(res429.body.success).toBe(false);
      expect(res429.body.message).toContain("Rate limit exceeded");
    });
  });
});
