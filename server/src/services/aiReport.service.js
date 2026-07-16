const { z } = require("zod");

const severityOrder = { low: 1, medium: 2, high: 3 };

const providerReportSchema = z.object({
  riskScore: z.number().min(0).max(100),
  flags: z.array(
    z.object({
      type: z.string().min(1),
      count: z.number().int().min(1),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ).max(20),
}).strict();

const callJsonApi = async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`AI provider request failed (${response.status})`);
  return response.json();
};

const parseModelJson = (text) => {
  const json = JSON.parse(String(text).replace(/^```json\s*|\s*```$/g, "").trim());
  return providerReportSchema.parse(json);
};

const eventSummary = (events) => ({
  totalEvents: events.length,
  eventCounts: events.reduce((counts, event) => {
    counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    return counts;
  }, {}),
});

const buildPrompt = (summary) => [
  "You are an assessment-proctoring risk analyst.",
  "Assess only the supplied aggregated behavioral-event data.",
  "Return JSON only using this exact schema:",
  '{"riskScore": number 0-100, "flags": [{"type": string, "count": positive integer, "severity": "low"|"medium"|"high"}]}',
  "Do not infer identity, protected traits, or cheating certainty. Flags are review signals only.",
  `Event summary: ${JSON.stringify(summary)}`,
].join("\n");

const analyzeWithGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const payload = await callJsonApi(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    },
  );
  return parseModelJson(payload.candidates?.[0]?.content?.parts?.[0]?.text);
};

const analyzeWithGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const payload = await callJsonApi("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  return parseModelJson(payload.choices?.[0]?.message?.content);
};

const combineReports = (gemini, groq) => {
  const flags = new Map();
  for (const flag of [...gemini.flags, ...groq.flags]) {
    const existing = flags.get(flag.type);
    if (!existing) {
      flags.set(flag.type, { ...flag });
      continue;
    }
    existing.count = Math.max(existing.count, flag.count);
    if (severityOrder[flag.severity] > severityOrder[existing.severity]) {
      existing.severity = flag.severity;
    }
  }
  return {
    riskScore: Math.round((gemini.riskScore + groq.riskScore) / 2),
    flags: [...flags.values()],
    generatedAt: new Date(),
  };
};

const generateAiReport = async (events) => {
  const prompt = buildPrompt(eventSummary(events));
  const [gemini, groq] = await Promise.all([analyzeWithGemini(prompt), analyzeWithGroq(prompt)]);
  return combineReports(gemini, groq);
};

module.exports = { generateAiReport };
