import { useQuery } from "@tanstack/react-query";
import { apiFetch, USE_MOCKS } from "@/lib/api";
import { popularStocks, stockDetails } from "@/data/dummyData";
import { generateHistory } from "@/lib/mockHistory";
import type { PricePoint, StockDetail, StockSummary, TimeRange } from "@/types/api";

/**
 * 🔌 GET /api/stocks/:symbol
 */
export const useStock = (symbol: string | undefined) =>
  useQuery({
    queryKey: ["stock", symbol],
    enabled: !!symbol,
    queryFn: async (): Promise<StockDetail | null> => {
      if (!symbol) return null;
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        const s = stockDetails[symbol.toUpperCase()];
        return s ? (s as StockDetail) : null;
      }
      return apiFetch<StockDetail>(`/api/stocks/${symbol.toUpperCase()}`);
    },
  });

/**
 * 🔌 GET /api/stocks/:symbol/history?range=...
 */
export const useStockHistory = (symbol: string | undefined, range: TimeRange) =>
  useQuery({
    queryKey: ["stock-history", symbol, range],
    enabled: !!symbol,
    queryFn: async (): Promise<PricePoint[]> => {
      if (!symbol) return [];
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 250));
        const detail = stockDetails[symbol.toUpperCase()];
        return generateHistory(symbol, detail?.price ?? 1000, range);
      }
      return apiFetch<PricePoint[]>(`/api/stocks/${symbol.toUpperCase()}/history?range=${range}`);
    },
  });

/**
 * 🔌 GET /api/recommendations  (uses auth + preferences)
 * Mock returns popularStocks for now.
 */
export const useRecommendations = () =>
  useQuery({
    queryKey: ["recommendations"],
    queryFn: async (): Promise<StockSummary[]> => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 200));
        return popularStocks as StockSummary[];
      }
      return apiFetch<StockSummary[]>(`/api/recommendations`);
    },
  });
