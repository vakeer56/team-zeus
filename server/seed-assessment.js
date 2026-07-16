require('dotenv').config();
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

const AssessmentSchema = new mongoose.Schema({}, { strict: false });
const Assessment = mongoose.model('Assessment', AssessmentSchema, 'assessments');

async function seed() {
  const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/Evalix-dev';
  console.log(`Connecting to MongoDB at ${dbUrl}...`);
  await mongoose.connect(dbUrl);

  // Find recruiter
  const recruiter = await User.findOne({ email: 'admin@recruiter.evalix.com' });
  if (!recruiter) {
    console.error("Recruiter account admin@recruiter.evalix.com not found. Please run npm run dev or create-recruiter first.");
    process.exit(1);
  }

  // Check if assessment already exists
  const existing = await Assessment.findOne({ title: "Python & Security Telemetry Challenge" });
  if (existing) {
    console.log("Assessment already seeded.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Create professional assessment
  await Assessment.create({
    title: "Python & Security Telemetry Challenge",
    description: "Analyze sandbox compiler telemetry and verify secure coding algorithms. Ensure proper sanitization against OS Command Injection and execute subroutines cleanly.",
    duration: 60,
    difficulty: "medium",
    status: "published",
    createdBy: recruiter._id,
    questions: [
      {
        question: "Which of the following is considered the most secure way to run shell commands in Python to prevent OS Command Injection vulnerabilities?",
        type: "MCQ",
        marks: 20,
        options: [
          "Utilizing os.system('command ' + input_param)",
          "Executing subprocess.run(arguments_list, shell=False) with parameterized inputs",
          "Spawning shells using os.popen() with sanitized variables",
          "Feeding strings into the eval() interpreter dynamically"
        ],
        correctOptionIndex: 1
      },
      {
        question: "Implement a secure Python function Solution.lengthOfLongestSubstring(s: str) -> int that determines the length of the longest substring without repeating characters.",
        type: "CODE",
        marks: 80,
        starterCode: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your secure Python code here\n        char_map = {}\n        max_length = 0\n        start = 0\n        \n        for end, char in enumerate(s):\n            if char in char_map and char_map[char] >= start:\n                start = char_map[char] + 1\n            char_map[char] = end\n            max_length = max(max_length, end - start + 1)\n            \n        return max_length",
        language: "python",
        sampleTestCases: [
          { input: '"abcabcbb"', expectedOutput: "3" },
          { input: '"bbbbb"', expectedOutput: "1" }
        ],
        hiddenTestCases: [
          { input: '"pwwkew"', expectedOutput: "3" },
          { input: '""', expectedOutput: "0" }
        ]
      }
    ]
  });

  console.log("----------------------------------------------------");
  console.log("Professional Assessment Seeding Completed!");
  console.log("Title:    Python & Security Telemetry Challenge");
  console.log(`Owner:    ${recruiter.email}`);
  console.log("----------------------------------------------------");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Error seeding assessment:", err);
  process.exit(1);
});
