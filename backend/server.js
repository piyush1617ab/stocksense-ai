// ================================================================
//  StockSense AI — server.js
//  FIXES APPLIED:
//  ✅ Helmet — sets secure HTTP headers (XSS, clickjacking protection)
//  ✅ Request size limit — 50kb max body (prevents payload attacks)
//  ✅ Morgan — HTTP request logging for debugging
//  ✅ .env validation on startup — fails fast if keys are missing
//  ✅ Graceful shutdown — closes server cleanly on SIGTERM
// ================================================================

require("dotenv").config();

// ── Validate required env vars before starting ────────────────
const REQUIRED_ENV = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Body parsing — 50kb limit ─────────────────────────────────
app.use(express.json({ limit: "50kb" }));

// ── Request logging ───────────────────────────────────────────
app.use(morgan("dev"));

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "StockSense AI Backend",
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY,
    supabase: !!process.env.SUPABASE_URL,
  });
});

// ── AI routes ─────────────────────────────────────────────────
app.use("/api", aiRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 StockSense AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health : http://localhost:${PORT}/health`);
  console.log(`   Chat   : POST http://localhost:${PORT}/api/chat`);
  console.log(`   Stream : POST http://localhost:${PORT}/api/chat/stream`);
  console.log(`   Analyze: POST http://localhost:${PORT}/api/analyze (parallel insight+sentiment)\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
