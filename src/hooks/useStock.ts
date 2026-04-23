import { useQuery } from "@tanstack/react-query";
import { USE_MOCKS } from "@/lib/api";
import { popularStocks, stockDetails } from "@/data/dummyData";
import { generateHistory } from "@/lib/mockHistory";
import { stocksApi } from "@/lib/stocksApi";
import type { PricePoint, StockDetail, StockSummary, TimeRange } from "@/types/api";

/**
 * 🔌 Stock detail (live quote + AI-style insights derived locally).
 */
export const useStock = (symbol: string | undefined, exchange: string = "NSE") =>
  useQuery({
    queryKey: ["stock", symbol, exchange],
    enabled: !!symbol,
    staleTime: 30_000,
    queryFn: async (): Promise<StockDetail | null> => {
      if (!symbol) return null;

      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 200));
        const s = stockDetails[symbol.toUpperCase()];
        return s ? (s as StockDetail) : null;
      }

      const [quote, news] = await Promise.all([
        stocksApi.quote(symbol, exchange),
        stocksApi.news(symbol, symbol).catch(() => []),
      ]);

      // Derive simple indicators client-side so the UI stays rich without
      // burning premium endpoints. RSI/MA approximated from open/close/range.
      const range = Math.max(quote.high - quote.low, 0.01);
      const positionInRange = (quote.price - quote.low) / range; // 0..1
      const rsi = Math.round(30 + positionInRange * 40); // 30..70
      const movingAvg = Number(((quote.open + quote.price) / 2).toFixed(2));
      const trendType: "success" | "danger" | "neutral" =
        quote.changePercent > 0.3 ? "success" : quote.changePercent < -0.3 ? "danger" : "neutral";
      const trend =
        trendType === "success" ? "Bullish" : trendType === "danger" ? "Bearish" : "Neutral";

      return {
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        sector: undefined,
        trend,
        trendType,
        rsi,
        movingAvg,
        aiExplanation: `${quote.name} is trading at ${quote.currency} ${quote.price.toFixed(2)} on ${quote.exchange}. Today's range: ${quote.low.toFixed(2)}–${quote.high.toFixed(2)}. The stock is ${trend.toLowerCase()} with a ${quote.changePercent.toFixed(2)}% move from the previous close. Indicators (RSI ~${rsi}, MA ~${movingAvg}) are derived from intraday levels — use them as a quick read, not a recommendation.`,
        news,
      } satisfies StockDetail;
    },
  });

/**
 * 🔌 Historical price series.
 */
export const useStockHistory = (
  symbol: string | undefined,
  range: TimeRange,
  exchange: string = "NSE",
) =>
  useQuery({
    queryKey: ["stock-history", symbol, range, exchange],
    enabled: !!symbol,
    staleTime: 60_000,
    queryFn: async (): Promise<PricePoint[]> => {
      if (!symbol) return [];
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 200));
        const detail = stockDetails[symbol.toUpperCase()];
        return generateHistory(symbol, detail?.price ?? 1000, range);
      }
      return stocksApi.history(symbol, exchange, range);
    },
  });

/**
 * 🔌 Recommendations — uses local popular list as a curated default.
 * Replace with a personalised endpoint once you have user preferences.
 */
export const useRecommendations = () =>
  useQuery({
    queryKey: ["recommendations"],
    staleTime: 60_000,
    queryFn: async (): Promise<StockSummary[]> => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 150));
        return popularStocks as StockSummary[];
      }
      // Fetch live quotes for the curated NSE basket in parallel.
      const symbols = popularStocks.map((s) => s.symbol);
      const quotes = await Promise.all(
        symbols.map((s) =>
          stocksApi.quote(s, "NSE").catch(() => null),
        ),
      );
      return quotes
        .filter((q): q is NonNullable<typeof q> => !!q)
        .map((q) => ({
          symbol: q.symbol,
          name: q.name,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
        }));
    },
  });
