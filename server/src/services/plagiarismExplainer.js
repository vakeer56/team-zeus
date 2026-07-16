const truncateCode = (code) => {
  if (!code) return "";
  return code.split("\n").slice(0, 150).join("\n");
};

/**
 * Generate a structured explanation of similarity between two code submissions.
 * Uses Groq API with llama-3.3-70b-versatile.
 */
const explainSimilarity = async (candidateACode, candidateBCode, similarityScore, questionContext) => {
  const fallback = {
    verdict_hint: "inconclusive",
    key_evidence: [],
    differences_noted: [],
    explanation: "Automated explanation unavailable — refer to raw similarity score.",
    confidence: "low"
  };

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("GROQ_API_KEY is not defined in the environment.");
      return fallback;
    }

    const codeA = truncateCode(candidateACode);
    const codeB = truncateCode(candidateBCode);

    const systemPrompt = `You are an expert code analyst specializing in detecting code plagiarism and similarity.
Analyze the two provided code submissions (Candidate A and Candidate B) and explain the evidence of similarity or plagiarism.
The algorithmic checker has already flagged them with a similarity score. Your task is NOT to decide if plagiarism occurred, but rather to explain the similarities and differences objectively for a recruiter-facing dashboard.
You MUST respond ONLY with a raw, valid JSON object matching the following JSON schema:
{
  "verdict_hint": "strong evidence of copy-paste" | "likely independent implementation" | "inconclusive",
  "key_evidence": ["Evidence point 1", "Evidence point 2"],
  "differences_noted": ["Difference 1", "Difference 2"],
  "explanation": "Detailed explanation of why they look similar, identifying patterns, structure, variable names, or shared unique logic.",
  "confidence": "high" | "medium" | "low"
}
Do not wrap the response in markdown code blocks or any other formatting. Only return the raw JSON object.`;

    const userPrompt = `Similarity Score: ${similarityScore}
Question Context / Description: ${questionContext}

Candidate A Code:
${codeA}

Candidate B Code:
${codeB}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error(`Groq API returned status ${response.status}`);
      return fallback;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return fallback;
    }

    // Strip markdown code fences if present
    let cleanResponse = rawContent.trim();
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanResponse);
      return {
        verdict_hint: parsed.verdict_hint || "inconclusive",
        key_evidence: Array.isArray(parsed.key_evidence) ? parsed.key_evidence : [],
        differences_noted: Array.isArray(parsed.differences_noted) ? parsed.differences_noted : [],
        explanation: parsed.explanation || "Automated explanation unavailable — refer to raw similarity score.",
        confidence: parsed.confidence || "low"
      };
    } catch (parseErr) {
      console.error("Failed to parse LLM response as JSON:", parseErr, "Raw Content:", rawContent);
      return fallback;
    }

  } catch (err) {
    console.error("Error in explainSimilarity service:", err);
    return fallback;
  }
};

module.exports = {
  explainSimilarity
};
