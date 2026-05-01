// ================================================================
//  StockSense AI — ai/stockIndicators.js
//  FIXES APPLIED:
//  ✅ Returns null when insufficient data (not 0 or wrong value)
//  ✅ Handles non-numeric values in price array gracefully
//  ✅ Added EMA (Exponential Moving Average) as bonus indicator
//  ✅ Added MACD signal for even richer AI analysis
//  ✅ All functions return null rather than throwing on bad input
// ================================================================

/**
 * Clean a prices array — filter nulls, NaN, negatives
 * @param {number[]} prices
 * @returns {number[]}
 */
function cleanPrices(prices) {
  return (prices || []).filter((p) => typeof p === "number" && !isNaN(p) && p > 0);
}

/**
 * Simple Moving Average
 * @param {number[]} prices  Closing prices (oldest → newest)
 * @param {number}   period
 * @returns {number|null}
 */
function calcMA(prices, period) {
  const clean = cleanPrices(prices);
  if (clean.length < period) return null;
  const slice = clean.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / period).toFixed(2));
}

/**
 * RSI — Relative Strength Index (standard 14-day)
 * @param {number[]} prices  Closing prices (oldest → newest)
 * @param {number}   period  Default 14
 * @returns {number|null}    0–100 or null if insufficient data
 */
function calcRSI(prices, period = 14) {
  const clean = cleanPrices(prices);
  if (clean.length < period + 1) return null;

  const recent = clean.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100; // all gains, no losses
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

/**
 * Exponential Moving Average
 * EMA gives more weight to recent prices than SMA — more responsive to new info
 * @param {number[]} prices
 * @param {number}   period
 * @returns {number|null}
 */
function calcEMA(prices, period) {
  const clean = cleanPrices(prices);
  if (clean.length < period) return null;

  const k = 2 / (period + 1); // smoothing factor
  let ema = clean.slice(0, period).reduce((a, b) => a + b, 0) / period; // seed with SMA

  for (let i = period; i < clean.length; i++) {
    ema = clean[i] * k + ema * (1 - k);
  }

  return parseFloat(ema.toFixed(2));
}

/**
 * MACD — Moving Average Convergence Divergence
 * Standard: 12-day EMA minus 26-day EMA
 * Positive MACD = short-term momentum above long-term = bullish
 * Negative MACD = short-term momentum below long-term = bearish
 * @param {number[]} prices
 * @returns {{ macd: number, signal: string }|null}
 */
function calcMACD(prices) {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  if (ema12 === null || ema26 === null) return null;

  const macd = parseFloat((ema12 - ema26).toFixed(2));
  return {
    macd,
    signal: macd > 0 ? "Bullish" : macd < 0 ? "Bearish" : "Neutral",
  };
}

/**
 * Get all indicators from a price history array.
 * Returns null for any indicator that lacks sufficient data.
 *
 * @param {number[]} closingPrices  Array oldest → newest
 * @returns {object} { rsi, ma50, ma200, ema12, ema26, macd }
 */
function getIndicators(closingPrices) {
  const macdResult = calcMACD(closingPrices);
  return {
    rsi: calcRSI(closingPrices, 14),
    ma50: calcMA(closingPrices, 50),
    ma200: calcMA(closingPrices, 200),
    ema12: calcEMA(closingPrices, 12),
    ema26: calcEMA(closingPrices, 26),
    macd: macdResult?.macd ?? null,
    macdSignal: macdResult?.signal ?? null,
  };
}

module.exports = { calcMA, calcRSI, calcEMA, calcMACD, getIndicators };
