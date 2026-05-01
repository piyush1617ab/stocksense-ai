import { useState } from "react";
import { GraduationCap, Lightbulb } from "lucide-react";
import GlossaryTerm from "@/components/glossary/GlossaryTerm";

interface Props {
  symbol: string;
  name: string;
  rsi: number;
  price: number;
  movingAvg: number;
  trend: string;
}

/**
 * Beginner-mode panel that rewrites every metric into plain English.
 * Toggle between "Beginner" and "Pro" view.
 */
const StockExplainer = ({ symbol, name, rsi, price, movingAvg, trend }: Props) => {
  const [beginner, setBeginner] = useState(true);

  const rsiPlain =
    rsi > 70
      ? `Lots of people have been buying ${symbol} recently — it might be due for a short pause.`
      : rsi < 30
        ? `${symbol} has been sold heavily. Some investors see this as a possible bargain zone.`
        : `${symbol}'s buying and selling pressure is balanced — no extreme moves right now.`;

  const maPlain =
    price > movingAvg
      ? `Today's price (₹${price.toLocaleString()}) is above its 50-day average (₹${movingAvg.toLocaleString()}). Generally a sign of strength.`
      : `Today's price (₹${price.toLocaleString()}) is below its 50-day average (₹${movingAvg.toLocaleString()}). Generally a sign of weakness.`;

  const trendPlain = `Overall short-term trend: ${trend.toLowerCase()}. This is the AI's read on recent price + volume.`;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Explain {symbol} to me</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
          <button
            onClick={() => setBeginner(true)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              beginner ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => setBeginner(false)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              !beginner ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Technical
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {beginner
          ? "Plain-English interpretation of the metrics above."
          : "Raw indicators for those familiar with technical analysis."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-background/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trend</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {beginner ? trendPlain : `${trend} — based on momentum + volume divergence.`}
          </p>
        </div>
        <div className="rounded-xl border bg-background/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <GlossaryTerm termKey="rsi">RSI</GlossaryTerm>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {beginner ? rsiPlain : `RSI(14) = ${rsi}. ${rsi > 70 ? "Overbought." : rsi < 30 ? "Oversold." : "Neutral range."}`}
          </p>
        </div>
        <div className="rounded-xl border bg-background/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            50-day <GlossaryTerm termKey="ma">MA</GlossaryTerm>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {beginner
              ? maPlain
              : `Price ₹${price.toLocaleString()} vs MA50 ₹${movingAvg.toLocaleString()} → ${
                  price > movingAvg ? "above (bullish bias)" : "below (bearish bias)"
                }.`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          New to investing? Hover the dotted terms for definitions. Pair this with the AI Explanation below to understand{" "}
          <span className="font-medium text-foreground">{name}</span> in context.
        </p>
      </div>
    </div>
  );
};

export default StockExplainer;
