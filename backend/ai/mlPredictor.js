// ================================================================
//  StockSense AI — ai/mlPredictor.js
//  Thin HTTP client that calls the Python FastAPI ML microservice.
//
//  The ML service must be running separately:
//    cd backend/ml && uvicorn ml_service:app --port 8001
//
//  Set ML_SERVICE_URL in your .env (default: http://localhost:8001)
// ================================================================

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const TIMEOUT_MS     = 5000;   // fail fast if the service is down

/**
 * Call the ML service for a buy/sell/hold prediction.
 *
 * @param {object} params
 * @param {string}      params.symbol
 * @param {number}      params.rsi             0–100
 * @param {number}      params.price           current price (₹)
 * @param {number|null} params.ma50            50-day SMA (optional)
 * @param {number|null} params.ma200           200-day SMA (optional)
 * @param {number|null} params.ema12           12-day EMA  (optional)
 * @param {number|null} params.ema26           26-day EMA  (optional)
 * @param {number}      params.change_pct      today's % change
 * @param {number}      params.sentiment_score -1 to +1
 * @param {number|null} params.volatility      20-day rolling std of % returns (optional)
 * @param {number|null} params.momentum        10-day price rate-of-change % (optional)
 *
 * @returns {Promise<{signal: string, confidence: number, probabilities: object, top_features: object[], explanation: string, features_used: object, model_version: string}|null>}
 *          Returns null when the ML service is unreachable (caller uses rule-based fallback).
 */
async function mlPredict(params) {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(params),
      signal:  controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ML service returned ${res.status}: ${text}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("[mlPredictor] ML service timed out — using rule-based fallback");
    } else {
      console.warn("[mlPredictor] ML service unavailable:", err.message, "— using rule-based fallback");
    }
    return null;   // caller must handle null gracefully
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if the ML service is healthy.
 * @returns {Promise<boolean>}
 */
async function mlHealthCheck() {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { mlPredict, mlHealthCheck };
