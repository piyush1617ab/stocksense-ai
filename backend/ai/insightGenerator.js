// ================================================================
//  StockSense AI — ai/insightGenerator.js
//  FIXES APPLIED:
//  ✅ Retry logic — retries once with stricter prompt if JSON fails
//  ✅ Input validation — rejects invalid RSI/price values early
//  ✅ trendType derived locally as fallback if AI gets it wrong
//  ✅ Timeout — rejects if Gemini takes > 15 seconds
//  ✅ Output schema validation before returning
//  ✅ Both ma50 AND ma200 returned separately (was only movingAvg)
// ================================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const TIMEOUT_MS = 15000;

// ── Input validation ──────────────────────────────────────────
function validateStockData({ symbol, price, rsi, ma50, ma200 }) {
  const errors = [];
  if (!symbol || typeof symbol !== "string") errors.push("symbol is required");
  if (typeof price !== "number" || price <= 0) errors.push("price must be a positive number");
  if (typeof rsi !== "number" || rsi < 0 || rsi > 100) errors.push("rsi must be between 0 and 100");
  if (ma50 !== null && typeof ma50 !== "number") errors.push("ma50 must be a number or null");
  if (ma200 !== null && typeof ma200 !== "number") errors.push("ma200 must be a number or null");
  return errors;
}

// ── Deterministic fallback for trendType ─────────────────────
// If AI returns wrong trendType, we compute it from the data
function deriveTrendType(trend) {
  const t = (trend || "").toLowerCase();
  if (t.includes("up")) return "success";
  if (t.includes("down")) return "danger";
  return "neutral";
}

// ── Timeout wrapper ───────────────────────────────────────────
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
    ),
  ]);
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
 * Generate structured AI insight from stock data.
 * Returns object matching frontend StockDetailSchema.
 *
 * @param {object} stockData { symbol, price, rsi, ma50, ma200, news[] }
 * @returns {object} Full insight matching StockDetail type
 */
async function generateInsight(stockData) {
  const { symbol, price, rsi, ma50 = null, ma200 = null, news = [] } = stockData;

  // Validate inputs before calling AI
  const errors = validateStockData({ symbol, price, rsi, ma50, ma200 });
  if (errors.length) throw new Error(`Invalid stock data: ${errors.join(", ")}`);

  const goldenCross = ma50 && ma200 ? ma50 > ma200 : null;
  const overbought = rsi > 70;
  const oversold = rsi < 30;

  const prompt = buildInsightPrompt({ symbol, price, rsi, ma50, ma200, news, goldenCross, overbought, oversold });

  let result;
  try {
    result = await callGemini(prompt);
  } catch (firstError) {
    console.warn("[insightGenerator] First attempt failed:", firstError.message, "— retrying...");
    // Retry with even more explicit instructions
    try {
      result = await callGemini(prompt + "\n\nCRITICAL: Your previous response failed JSON parsing. Return ONLY a raw JSON object. No text, no markdown, no code fences. Start with { and end with }.");
    } catch (retryError) {
      console.error("[insightGenerator] Retry also failed:", retryError.message);
      // Return a safe fallback so the frontend doesn't crash
      return buildFallback(symbol, price, rsi, ma50, ma200);
    }
  }

  // Ensure trendType is always valid (AI occasionally gets this wrong)
  if (!["success", "danger", "neutral"].includes(result.trendType)) {
    result.trendType = deriveTrendType(result.trend);
  }

  // Ensure required fields exist
  return {
    trend: result.trend || "Sideways",
    trendType: result.trendType || "neutral",
    risk: result.risk || "Medium",
    explanation: result.explanation || "",
    aiExplanation: result.aiExplanation || result.explanation || "",
    news_sentiment: result.news_sentiment || "Neutral",
    news_impact: result.news_impact || "",
    key_signals: Array.isArray(result.key_signals) ? result.key_signals : [],
    movingAvg50: ma50,   // renamed from movingAvg for clarity
    movingAvg200: ma200,
    disclaimer: result.disclaimer || "This analysis is for educational purposes only.",
  };
}

function buildInsightPrompt({ symbol, price, rsi, ma50, ma200, news, goldenCross, overbought, oversold }) {
  return `
You are a stock analysis AI for Indian markets. Respond ONLY with valid JSON. No markdown, no code fences, no extra text. Start your response with { and end with }.

Stock Data:
- Symbol      : ${symbol}
- Price       : ₹${price}
- RSI (14-day): ${rsi}${overbought ? " (OVERBOUGHT)" : oversold ? " (OVERSOLD)" : ""}
- 50-day MA   : ${ma50 ? "₹" + ma50 : "Not available (< 50 data points)"}
- 200-day MA  : ${ma200 ? "₹" + ma200 : "Not available (< 200 data points)"}
- MA Signal   : ${goldenCross === null ? "Cannot determine (insufficient data)" : goldenCross ? "Golden Cross (50MA > 200MA = bullish)" : "Death Cross (50MA < 200MA = bearish)"}
- News        : ${news.length ? news.join("; ") : "No recent news"}

Required JSON (ALL fields mandatory, exact types):
{
  "trend": "Uptrend" or "Downtrend" or "Sideways",
  "trendType": "success" or "danger" or "neutral",
  "risk": "Low" or "Medium" or "High",
  "explanation": "string — 2-3 sentences for someone who knows basic markets",
  "aiExplanation": "string — 1-2 sentences using a simple everyday analogy for a complete beginner",
  "news_sentiment": "Positive" or "Negative" or "Neutral",
  "news_impact": "string — one sentence on how the news affects this stock",
  "key_signals": ["string", "string", "string"],
  "disclaimer": "string"
}

Rules:
- trendType = "success" if Uptrend, "danger" if Downtrend, "neutral" if Sideways
- risk = "High" if RSI > 75 or RSI < 25 or Death Cross; "Low" if RSI 40-60 and Golden Cross; "Medium" otherwise
`;
}

// ── Safe fallback when AI completely fails ────────────────────
function buildFallback(symbol, price, rsi, ma50, ma200) {
  const goldenCross = ma50 && ma200 ? ma50 > ma200 : null;
  const trend = goldenCross === true ? "Uptrend" : goldenCross === false ? "Downtrend" : "Sideways";
  return {
    trend,
    trendType: trend === "Uptrend" ? "success" : trend === "Downtrend" ? "danger" : "neutral",
    risk: rsi > 70 || rsi < 30 ? "High" : "Medium",
    explanation: `${symbol} is trading at ₹${price} with an RSI of ${rsi}.`,
    aiExplanation: `This stock's technical indicators suggest a ${trend.toLowerCase()} at current price levels.`,
    news_sentiment: "Neutral",
    news_impact: "Unable to analyze news at this time.",
    key_signals: [`RSI at ${rsi}`, ma50 ? `50-day MA at ₹${ma50}` : "MA50 unavailable", ma200 ? `200-day MA at ₹${ma200}` : "MA200 unavailable"],
    movingAvg50: ma50,
    movingAvg200: ma200,
    disclaimer: "This analysis is for educational purposes only.",
  };
}

module.exports = { generateInsight };
