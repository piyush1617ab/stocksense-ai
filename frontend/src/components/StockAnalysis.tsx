import { useState, useEffect } from "react";
import { Target, Shield, AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Cpu, RefreshCw } from "lucide-react";
import type { StockDetail, MLPrediction } from "@/types/api";
import { apiFetch, USE_MOCKS } from "@/lib/api";

interface Props {
  stock: StockDetail;
}

interface Factor {
  label: string;
  signal: "bullish" | "bearish" | "neutral";
  explanation: string;
}

// ── Compute news sentiment score (−1 to +1) from headlines ──────────────────
function computeSentimentScore(stock: StockDetail): number {
  const positive = stock.news.filter((n) =>
    /win|crosses|improve|growth|recovery|partner|raises|milestone|announce/i.test(n.title)
  ).length;
  const negative = stock.news.filter((n) =>
    /headwind|fall|drop|concern|slowdown|loss|decline/i.test(n.title)
  ).length;
  const total = stock.news.length || 1;
  return parseFloat(((positive - negative) / total).toFixed(2));
}

// ── Rule-based factor analysis (kept as the explanation layer) ───────────────
const getFactors = (stock: StockDetail): Factor[] => {
  const factors: Factor[] = [];

  factors.push({
    label: "Price Trend",
    signal: stock.trendType === "success" ? "bullish" : stock.trendType === "danger" ? "bearish" : "neutral",
    explanation:
      stock.trendType === "success"
        ? "The stock is in an upward trend — prices have been rising consistently."
        : stock.trendType === "danger"
        ? "The stock is in a downward trend — prices have been falling."
        : "The stock is moving sideways without a clear direction.",
  });

  factors.push({
    label: "RSI (Momentum)",
    signal: stock.rsi > 70 ? "bearish" : stock.rsi < 30 ? "bullish" : "neutral",
    explanation:
      stock.rsi > 70
        ? `RSI is ${stock.rsi} (overbought) — the stock may have risen too fast. A pullback is possible.`
        : stock.rsi < 30
        ? `RSI is ${stock.rsi} (oversold) — the stock may have fallen too much. A bounce is possible.`
        : `RSI is ${stock.rsi} (neutral) — no extreme buying or selling pressure.`,
  });

  const aboveMA = stock.price > stock.movingAvg;
  const maDiff  = ((stock.price - stock.movingAvg) / stock.movingAvg * 100).toFixed(1);
  factors.push({
    label: "50-Day Moving Average",
    signal: aboveMA ? "bullish" : "bearish",
    explanation: aboveMA
      ? `Price is ${maDiff}% above the 50-day MA (₹${stock.movingAvg.toLocaleString()}) — a sign of strength.`
      : `Price is ${Math.abs(Number(maDiff))}% below the 50-day MA (₹${stock.movingAvg.toLocaleString()}) — a sign of weakness.`,
  });

  factors.push({
    label: "Today's Movement",
    signal: stock.change > 0 ? "bullish" : stock.change < 0 ? "bearish" : "neutral",
    explanation: `Stock moved ${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%) today.`,
  });

  const positiveNews = stock.news.filter((n) =>
    /win|crosses|improve|growth|recovery|partner|raises|milestone|announce/i.test(n.title)
  ).length;
  const negativeNews = stock.news.filter((n) =>
    /headwind|fall|drop|concern|slowdown|loss|decline/i.test(n.title)
  ).length;
  factors.push({
    label: "News Sentiment",
    signal: positiveNews > negativeNews ? "bullish" : negativeNews > positiveNews ? "bearish" : "neutral",
    explanation: `${positiveNews} positive and ${negativeNews} negative news items detected from recent headlines.`,
  });

  return factors;
};

// ── Derive rule-based verdict from factors (fallback when ML is unavailable) ──
const getRuleBasedVerdict = (factors: Factor[]): { verdict: string; score: number } => {
  const bullish = factors.filter((f) => f.signal === "bullish").length;
  const bearish = factors.filter((f) => f.signal === "bearish").length;
  const score   = Math.round((bullish / factors.length) * 100);

  let verdict: string;
  if (bullish >= 4)      verdict = "Strong Buy Signal";
  else if (bullish >= 3) verdict = "Moderate Buy Signal";
  else if (bearish >= 4) verdict = "Strong Caution";
  else if (bearish >= 3) verdict = "Moderate Caution";
  else                   verdict = "Neutral — Wait & Watch";

  return { verdict, score };
};

const SignalIcon = ({ signal }: { signal: string }) => {
  if (signal === "bullish") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (signal === "bearish") return <XCircle className="h-4 w-4 text-danger" />;
  return <AlertTriangle className="h-4 w-4 text-warning" />;
};

// ── ML score ring fill ────────────────────────────────────────────────────────
const ScoreRing = ({
  score,
  isBullish,
  isBearish,
}: {
  score: number;
  isBullish: boolean;
  isBearish: boolean;
}) => (
  <div className="relative h-16 w-16 shrink-0">
    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
      <path
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="3"
      />
      <path
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke={isBullish ? "hsl(var(--success))" : isBearish ? "hsl(var(--danger))" : "hsl(var(--muted-foreground))"}
        strokeWidth="3"
        strokeDasharray={`${score}, 100`}
        strokeLinecap="round"
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
      {score}%
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const StockAnalysis = ({ stock }: Props) => {
  const [expanded, setExpanded]       = useState(false);
  const [ml, setMl]                   = useState<MLPrediction | null>(null);
  const [mlLoading, setMlLoading]     = useState(!USE_MOCKS);
  const [mlError, setMlError]         = useState(false);

  // Compute rule-based factors (always shown as the explanation layer)
  const factors                       = getFactors(stock);
  const { verdict: ruleVerdict, score: ruleScore } = getRuleBasedVerdict(factors);
  const sentimentScore                = computeSentimentScore(stock);

  // ── Fetch ML prediction ─────────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCKS) return;   // skip in mock/dev mode

    let cancelled = false;
    setMlLoading(true);
    setMlError(false);

    apiFetch<MLPrediction>("/api/ml-predict", {
      method: "POST",
      body: {
        symbol:          stock.symbol,
        rsi:             stock.rsi,
        price:           stock.price,
        ma50:            stock.movingAvg ?? null,
        change_pct:      stock.changePercent,
        sentiment_score: sentimentScore,
      },
    })
      .then((data) => { if (!cancelled) setMl(data); })
      .catch(() => { if (!cancelled) setMlError(true); })
      .finally(() => { if (!cancelled) setMlLoading(false); });

    return () => { cancelled = true; };
  }, [stock.symbol, stock.rsi, stock.price, stock.movingAvg, stock.changePercent, sentimentScore]);

  // ── Derive display values from ML result or rule-based fallback ──────────────
  const usingML   = ml?.mlAvailable === true && ml.signal !== undefined && ml.confidence !== undefined;
  const mlScore   = usingML ? Math.round((ml!.confidence ?? 0) * 100) : null;
  const displayScore   = usingML ? mlScore! : ruleScore;
  const displayVerdict = usingML
    ? (ml!.signal === "BUY"
        ? (mlScore! >= 70 ? "Strong Buy Signal" : "Moderate Buy Signal")
        : (mlScore! >= 70 ? "Strong Caution"    : "Moderate Caution"))
    : ruleVerdict;

  const isBullish = displayScore >= 60;
  const isBearish = displayScore <= 40;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Should You Buy {stock.symbol}?
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "Collapse" : "Show details"}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Verdict card */}
      <div className={`rounded-2xl border p-6 shadow-sm relative overflow-hidden ${
        isBullish ? "bg-success/5 border-success/20" : isBearish ? "bg-danger/5 border-danger/20" : "bg-card"
      }`}>
        {/* ML / rule-based badge */}
        <div className="absolute top-3 right-3">
          {mlLoading ? (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" /> ML loading…
            </span>
          ) : usingML ? (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Cpu className="h-2.5 w-2.5" /> ML-powered
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Rule-based
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 ${
            isBullish ? "bg-success-muted" : isBearish ? "bg-danger-muted" : "bg-muted"
          }`}>
            {isBullish ? (
              <TrendingUp className="h-7 w-7 text-success" />
            ) : isBearish ? (
              <TrendingDown className="h-7 w-7 text-danger" />
            ) : (
              <Shield className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-lg font-bold ${
              isBullish ? "text-success" : isBearish ? "text-danger" : "text-foreground"
            }`}>
              {displayVerdict}
            </p>
            {usingML ? (
              <p className="text-sm text-muted-foreground">
                ML confidence: {displayScore}%{" "}
                <span className="text-xs">
                  (BUY {Math.round((ml!.probabilities?.BUY ?? 0) * 100)}% · SELL {Math.round((ml!.probabilities?.SELL ?? 0) * 100)}%)
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {factors.filter((f) => f.signal === "bullish").length} of {factors.length} factors are bullish
              </p>
            )}
          </div>

          <ScoreRing score={displayScore} isBullish={isBullish} isBearish={isBearish} />
        </div>

        {/* ML service error notice */}
        {mlError && (
          <p className="mt-3 text-xs text-muted-foreground">
            ⚡ ML service unavailable — showing rule-based analysis. Start the Python service to enable ML predictions.
          </p>
        )}
      </div>

      {/* Detailed factors — always shown when expanded */}
      {expanded && (
        <div className="space-y-2 animate-fade-in">
          {usingML && (
            <p className="text-xs text-muted-foreground px-1">
              The indicators below explain <em>why</em> the ML model gave this signal.
            </p>
          )}
          {factors.map((f) => (
            <div key={f.label} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <SignalIcon signal={f.signal} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                    f.signal === "bullish" ? "bg-success-muted text-success"
                    : f.signal === "bearish" ? "bg-danger-muted text-danger"
                    : "bg-warning-muted text-warning"
                  }`}>
                    {f.signal}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{f.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">
        ⚠️ This is an educational analysis using {usingML ? "an ML model trained on historical patterns" : "basic rule-based indicators"}.
        It is NOT financial advice. Always consult a qualified advisor before making investment decisions.
      </p>
    </div>
  );
};

export default StockAnalysis;
