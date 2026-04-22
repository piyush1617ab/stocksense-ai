/**
 * 🔌 STOCKS SERVICE — Backend integration point
 *
 * Wraps all stock-related API calls.
 * Currently delegates to useStock hooks + dummy data.
 * When you build your backend, the hooks in src/hooks/useStock.ts
 * already call apiFetch — just flip VITE_USE_MOCKS=false.
 *
 * This file provides imperative helpers for non-hook contexts
 * (e.g., inside services, utilities, or event handlers).
 */

import { apiFetch, USE_MOCKS } from "@/lib/api";
import { popularStocks, stockDetails } from "@/data/dummyData";
import type { StockDetail, StockSummary } from "@/types/api";

export async function searchStocks(query: string): Promise<StockSummary[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150));
    const q = query.toLowerCase();
    return (popularStocks as StockSummary[]).filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }
  return apiFetch<StockSummary[]>(`/api/stocks/search?q=${encodeURIComponent(query)}`);
}

export async function getStockDetail(symbol: string): Promise<StockDetail | null> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200));
    return (stockDetails[symbol.toUpperCase()] as StockDetail) ?? null;
  }
  return apiFetch<StockDetail>(`/api/stocks/${symbol.toUpperCase()}`);
}
