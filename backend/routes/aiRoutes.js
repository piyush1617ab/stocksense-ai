// ================================================================
//  StockSense AI — routes/aiRoutes.js
//  FIXES APPLIED:
//  ✅ Rate limiting per route (chat: 20/min, insight: 30/min)
//  ✅ SSE streaming endpoint for chat
//  ✅ userId extracted from JWT if available (not just from body)
//  ✅ Input validation with clear error messages
//  ✅ Request size limit enforced
// ================================================================

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { chat, streamChat, clearHistory } = require("../ai/chatbot");
const { generateInsight } = require("../ai/insightGenerator");
const { analyzeSentiment } = require("../ai/sentimentAnalyzer");
const { mlPredict } = require("../ai/mlPredictor");

// ── Async error wrapper ────────────────────────────────────────
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Rate limiters ─────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  max: 20,                   // 20 chat messages per minute per IP
  message: { error: "Too many messages. Please wait a moment before sending more." },
  standardHeaders: true,
  legacyHeaders: false,
});

const insightLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,                   // 30 insight requests per minute per IP
  message: { error: "Too many requests. Please try again shortly." },
});

// ── Utility: extract userId from JWT or body ──────────────────
// If your backend sends a decoded JWT on req.user, use that.
// Otherwise fall back to userId in body (less secure but works for now).
function getUserId(req) {
  return req.user?.id || req.user?.sub || req.body?.userId || null;
}

// ── POST /api/chat ─────────────────────────────────────────────
// Regular (non-streaming) chat
router.post(
  "/chat",
  chatLimiter,
  wrap(async (req, res) => {
    const { messages, stockContext = null } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required and must not be empty" });
    }

    // Validate message shape
    const invalid = messages.find((m) => !m.role || !m.content);
    if (invalid) {
      return res.status(400).json({ error: "Each message must have role and content fields" });
    }

    const reply = await chat(userId, messages, stockContext);
    res.json({ reply });
  })
);

// ── POST /api/chat/stream ─────────────────────────────────────
// Streaming chat via SSE — frontend receives tokens as generated
router.post(
  "/chat/stream",
  chatLimiter,
  wrap(async (req, res) => {
    const { messages, stockContext = null } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    await streamChat(userId, messages, stockContext, res);
  })
);

// ── DELETE /api/chat/:userId ───────────────────────────────────
router.delete(
  "/chat/:userId",
  wrap(async (req, res) => {
    const success = await clearHistory(req.params.userId);
    res.json({ success });
  })
);

// ── POST /api/insight ──────────────────────────────────────────
router.post(
  "/insight",
  insightLimiter,
  wrap(async (req, res) => {
    const { symbol, price, rsi, ma50, ma200, news = [] } = req.body;

    if (!symbol) return res.status(400).json({ error: "symbol is required" });
    if (typeof price !== "number") return res.status(400).json({ error: "price must be a number" });
    if (typeof rsi !== "number") return res.status(400).json({ error: "rsi must be a number" });

    const insight = await generateInsight({ symbol, price, rsi, ma50, ma200, news });
    res.json(insight);
  })
);

// ── POST /api/sentiment ────────────────────────────────────────
router.post(
  "/sentiment",
  insightLimiter,
  wrap(async (req, res) => {
    const { headlines = [], symbol = "" } = req.body;

    if (!Array.isArray(headlines)) {
      return res.status(400).json({ error: "headlines must be an array" });
    }

    const result = await analyzeSentiment(headlines, symbol);
    res.json(result);
  })
);

// ── POST /api/analyze ──────────────────────────────────────────
// Combined endpoint — calls insight + sentiment IN PARALLEL
// Saves frontend from making two separate requests
router.post(
  "/analyze",
  insightLimiter,
  wrap(async (req, res) => {
    const { symbol, price, rsi, ma50, ma200, news = [] } = req.body;

    if (!symbol || typeof price !== "number" || typeof rsi !== "number") {
      return res.status(400).json({ error: "symbol, price, and rsi are required" });
    }

    // Run insight and sentiment IN PARALLEL — ~50% faster than sequential
    const headlines = Array.isArray(news) ? news : [];
    const [insight, sentiment] = await Promise.all([
      generateInsight({ symbol, price, rsi, ma50, ma200, news: headlines }),
      analyzeSentiment(headlines, symbol),
    ]);

    res.json({ insight, sentiment });
  })
);

// ── POST /api/ml-predict ───────────────────────────────────────
// Proxies to the Python ML microservice for a buy/sell prediction.
// If the ML service is unreachable, responds with { mlAvailable: false }
// so the frontend can gracefully fall back to rule-based analysis.
router.post(
  "/ml-predict",
  insightLimiter,
  wrap(async (req, res) => {
    const {
      symbol     = "",
      rsi,
      price,
      ma50       = null,
      ma200      = null,
      ema12      = null,
      ema26      = null,
      change_pct = 0,
      sentiment_score = 0,
    } = req.body;

    if (typeof rsi   !== "number") return res.status(400).json({ error: "rsi must be a number"   });
    if (typeof price !== "number") return res.status(400).json({ error: "price must be a number" });

    const result = await mlPredict({ symbol, rsi, price, ma50, ma200, ema12, ema26, change_pct, sentiment_score });

    if (!result) {
      // ML service unavailable — frontend must handle this gracefully
      return res.json({ mlAvailable: false });
    }

    res.json({ mlAvailable: true, ...result });
  })
);

// ── Error handler ──────────────────────────────────────────────
router.use((err, req, res, _next) => {
  console.error("[AI Route Error]", err.message);
  res.status(500).json({ error: "AI service error", details: err.message });
});

module.exports = router;
