/**
 * Live stock data client. Calls the `stocks` Supabase Edge Function which
 * proxies Twelve Data so the API key stays server-side.
 *
 * To fall back to mocks (offline/dev), set VITE_USE_MOCKS=true in .env.
 */
import { supabase } from "@/integrations/supabase/client";

const FN = "stocks";

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country?: string;
}

export interface LiveQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  fiftyTwoWeek?: { high: number; low: number };
  currency: string;
}

export interface NewsLink {
  title: string;
  source: string;
  time: string;
  url: string;
}

async function call<T>(params: Record<string, string>): Promise<T> {
  const search = new URLSearchParams(params).toString();
  const { data, error } = await supabase.functions.invoke(`${FN}?${search}`, {
    method: "GET",
  });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

export const stocksApi = {
  search: (q: string) => call<SearchResult[]>({ action: "search", q }),
  quote: (symbol: string, exchange = "NSE") =>
    call<LiveQuote>({ action: "quote", symbol, exchange }),
  history: (symbol: string, exchange = "NSE", range = "1M") =>
    call<{ date: string; close: number }[]>({ action: "history", symbol, exchange, range }),
  news: (symbol: string, name: string) =>
    call<NewsLink[]>({ action: "news", symbol, name }),
};
