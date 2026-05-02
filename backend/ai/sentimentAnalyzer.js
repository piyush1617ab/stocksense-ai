// ================================================================
//  StockSense AI — ai/sentimentAnalyzer.js
//  FIXES APPLIED:
//  ✅ Retry logic on JSON parse failure
//  ✅ Timeout wrapper — won't hang if Gemini is slow
//  ✅ Input sanitization — strips HTML/scripts from headlines
//  ✅ Max 20 headlines enforced (prevents token overflow)
//  ✅ Safe fallback if both attempts fail
// ================================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const TIMEOUT_MS = 12000;
const MAX_HEADLINES = 20;

// ── Timeout wrapper ───────────────────────────────────────────
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Sanitize headlines ────────────────────────────────────────
// Strip HTML tags and limit length per headline
function sanitizeHeadlines(headlines) {
  return headlines
    .slice(0, MAX_HEADLINES)
    .map((h) => String(h).replace(/<[^>]*>/g, "").trim().slice(0, 200))
    .filter(Boolean);
}

// ── Core Gemini call ──────────────────────────────────────────
async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
  const raw = result.response.text();
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Main function ─────────────────────────────────────────────
/**
 * Analyze sentiment of stock news headlines.
 *
 * @param {string[]} headlines  Raw headline strings (max 20 used)
 * @param {string}   symbol     Optional stock symbol for context
 * @returns {object} Sentiment analysis result
 */
async function analyzeSentiment(headlines = [], symbol = "") {
  // Return safe default if no headlines (saves API quota)
  if (!headlines.length) {
    return {
      sentiment: "Neutral",
      confidence: "Low",
      summary: "No recent news found for this stock.",
      beginner_note: "We couldn't find recent news. This is common for smaller or less-covered stocks.",
      key_theme: "No data",
      breakdown: { positive: 0, negative: 0, neutral: 0 },
    };
  }

  const clean = sanitizeHeadlines(headlines);
  const prompt = buildPrompt(clean, symbol);

  let result;
  try {
    result = await callGemini(prompt);
  } catch (firstError) {
    console.warn("[sentimentAnalyzer] First attempt failed:", firstError.message, "— retrying...");
    try {
      result = await callGemini(prompt + "\n\nIMPORTANT: Return ONLY a raw JSON object. Start with { and end with }. No other text.");
    } catch (retryError) {
      console.error("[sentimentAnalyzer] Retry failed:", retryError.message);
      return buildFallback(clean);
    }
  }

  // Validate required fields
  return {
    sentiment: result.sentiment || "Neutral",
    confidence: result.confidence || "Low",
    summary: result.summary || "Unable to analyze sentiment at this time.",
    beginner_note: result.beginner_note || "",
    key_theme: result.key_theme || "",
    breakdown: result.breakdown || { positive: 0, negative: 0, neutral: clean.length },
  };
}

function buildPrompt(headlines, symbol) {
  return `
You are a financial news sentiment analyzer. Respond ONLY with valid JSON. No markdown, no code fences. Start with { and end with }.

Analyze these news headlines${symbol ? ` about ${symbol}` : ""}:
${headlines.map((h, i) => `${i + 1}. "${h}"`).join("\n")}

Required JSON (ALL fields mandatory):
{
  "sentiment": "Positive" or "Negative" or "Neutral" or "Mixed",
  "confidence": "High" or "Medium" or "Low",
  "summary": "string — 2 sentences: overall picture and what it means for the stock",
  "beginner_note": "string — 1 sentence for a first-time investor using a simple analogy",
  "key_theme": "string — 3-5 word phrase (e.g., 'Strong earnings growth')",
  "breakdown": {
    "positive": integer,
    "negative": integer,
    "neutral": integer
  }
}
`;
}

// ── Fallback when AI fails ────────────────────────────────────
function buildFallback(headlines) {
  return {
    sentiment: "Neutral",
    confidence: "Low",
    summary: "News sentiment analysis is temporarily unavailable.",
    beginner_note: "We couldn't analyze the news right now. Please try again shortly.",
    key_theme: "Analysis unavailable",
    breakdown: { positive: 0, negative: 0, neutral: headlines.length },
  };
}

module.exports = { analyzeSentiment };
