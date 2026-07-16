const truncateCode = (code) => {
  if (!code || typeof code !== "string") return "";
  const lines = code.split("\n");
  if (lines.length <= 150) return code;
  return lines.slice(0, 150).join("\n") + "\n... [truncated to 150 lines] ...";
};

/**
 * Explains code similarity using Groq's Llama 3.3 model.
 * 
 * @param {string} candidateACode - The code from candidate A.
 * @param {string} candidateBCode - The code from candidate B.
 * @param {number} similarityScore - The similarity score percentage.
 * @param {string} questionContext - Context or description of the question.
 * @returns {Promise<{verdict_hint: string, key_evidence: string[], differences_noted: string[], explanation: string, confidence: string}>}
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
      console.warn("GROQ_API_KEY is not configured.");
      return fallback;
    }

    const codeA = truncateCode(candidateACode);
    const codeB = truncateCode(candidateBCode);

    const systemPrompt = `You are an expert code plagiarism analysis assistant. Your job is to explain the similarities and differences between two code submissions flagged for similarity.
Do NOT decide if plagiarism occurred. The algorithmic similarity score is the source of truth; you only explain the evidence.
You must return a valid JSON object matching the requested schema. Do not output anything other than JSON.`;

    const userPrompt = `Compare the following two code submissions.

Question Context/Description:
${questionContext || "No question context provided."}

Similarity Score: ${similarityScore}%

Submission A:
${codeA}

Submission B:
${codeB}

Analyze their logical and structural similarities and differences, then return your analysis in this exact JSON schema:
{
  "verdict_hint": "strong_evidence" | "suspicious" | "boilerplate_only" | "inconclusive",
  "key_evidence": ["evidence line 1", "evidence line 2"],
  "differences_noted": ["difference 1", "difference 2"],
  "explanation": "Human-readable detailed explanation here",
  "confidence": "high" | "medium" | "low"
}`;

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      console.error(`Groq API request failed with status ${response.status}`);
      return fallback;
    }

    const data = await response.json();
    let text = data?.choices?.[0]?.message?.content;
    if (!text) {
      console.error("Groq API returned an empty response content.");
      return fallback;
    }

    // Strip markdown code fences if present
    text = text.replace(/^```json\s*|\s*```$/g, "").trim();

    const result = JSON.parse(text);
    
    return {
      verdict_hint: result.verdict_hint || "inconclusive",
      key_evidence: Array.isArray(result.key_evidence) ? result.key_evidence : [],
      differences_noted: Array.isArray(result.differences_noted) ? result.differences_noted : [],
      explanation: result.explanation || "Automated explanation unavailable — refer to raw similarity score.",
      confidence: result.confidence || "low"
    };

  } catch (error) {
    console.error("Failed to explain similarity via Groq API:", error.message || error);
    return fallback;
  }
};

module.exports = { explainSimilarity };
