// Edge function proxy for Twelve Data API.
// Keeps TWELVE_DATA_API_KEY server-side. Routes:
//   GET /stocks?action=search&q=reliance
//   GET /stocks?action=quote&symbol=RELIANCE&exchange=NSE
//   GET /stocks?action=history&symbol=RELIANCE&exchange=NSE&range=1M
//   GET /stocks?action=news&symbol=RELIANCE&name=Reliance%20Industries

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API = "https://api.twelvedata.com";
const KEY = Deno.env.get("TWELVE_DATA_API_KEY");

type RangeKey = "1D" | "1W" | "1M" | "1Y" | "5Y";

const RANGE_MAP: Record<RangeKey, { interval: string; outputsize: number }> = {
  "1D": { interval: "15min", outputsize: 32 },
  "1W": { interval: "1h", outputsize: 56 },
  "1M": { interval: "1day", outputsize: 30 },
  "1Y": { interval: "1week", outputsize: 52 },
  "5Y": { interval: "1month", outputsize: 60 },
};

function fmtSymbol(symbol: string, exchange?: string) {
  const ex = (exchange || "NSE").toUpperCase();
  return `${symbol.toUpperCase()}:${ex}`;
}

async function tdFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", KEY!);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data?.status === "error") {
    throw new Error(data.message || "Twelve Data error");
  }
  return data;
}

async function search(q: string) {
  const data = await tdFetch("/symbol_search", { symbol: q, outputsize: "25" });
  const list = (data?.data || []) as Array<{
    symbol: string;
    instrument_name: string;
    exchange: string;
    country: string;
    instrument_type: string;
  }>;
  // Prioritize Indian exchanges, then global equities
  const ranked = list
    .filter((s) => s.instrument_type?.toLowerCase().includes("stock") || s.instrument_type === "Common Stock" || !s.instrument_type)
    .map((s) => ({
      symbol: s.symbol,
      name: s.instrument_name,
      exchange: s.exchange,
      country: s.country,
    }))
    .sort((a, b) => {
      const aIN = a.exchange === "NSE" || a.exchange === "BSE" ? 0 : 1;
      const bIN = b.exchange === "NSE" || b.exchange === "BSE" ? 0 : 1;
      return aIN - bIN;
    });
  return ranked;
}

async function quote(symbol: string, exchange?: string) {
  const sym = fmtSymbol(symbol, exchange);
  const q = await tdFetch("/quote", { symbol: sym });
  const price = parseFloat(q.close);
  const prev = parseFloat(q.previous_close);
  const change = price - prev;
  const changePercent = (change / prev) * 100;
  return {
    symbol: q.symbol?.split(":")[0] ?? symbol.toUpperCase(),
    name: q.name ?? symbol.toUpperCase(),
    exchange: q.exchange ?? exchange ?? "NSE",
    price,
    change,
    changePercent,
    high: parseFloat(q.high),
    low: parseFloat(q.low),
    open: parseFloat(q.open),
    volume: parseInt(q.volume ?? "0", 10),
    fiftyTwoWeek: q.fifty_two_week
      ? { high: parseFloat(q.fifty_two_week.high), low: parseFloat(q.fifty_two_week.low) }
      : undefined,
    currency: q.currency ?? "INR",
  };
}

async function history(symbol: string, exchange: string | undefined, range: RangeKey) {
  const sym = fmtSymbol(symbol, exchange);
  const cfg = RANGE_MAP[range] ?? RANGE_MAP["1M"];
  const data = await tdFetch("/time_series", {
    symbol: sym,
    interval: cfg.interval,
    outputsize: String(cfg.outputsize),
    order: "ASC",
  });
  const values = (data?.values || []) as Array<{ datetime: string; close: string }>;
  return values.map((v) => ({ date: new Date(v.datetime).toISOString(), close: parseFloat(v.close) }));
}

// News: Twelve Data /news is premium. Fall back to a curated search-link list
// that always opens the official source via Google News.
function newsFor(symbol: string, name: string) {
  const q = encodeURIComponent(`${name} ${symbol} stock`);
  const sources = [
    { source: "Economic Times", host: "economictimes.indiatimes.com" },
    { source: "Mint", host: "livemint.com" },
    { source: "MoneyControl", host: "moneycontrol.com" },
    { source: "Business Standard", host: "business-standard.com" },
    { source: "Reuters", host: "reuters.com" },
  ];
  return sources.map((s) => ({
    title: `Latest ${name} news on ${s.source}`,
    source: s.source,
    time: "Live",
    url: `https://news.google.com/search?q=${q}+site%3A${s.host}`,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!KEY) throw new Error("TWELVE_DATA_API_KEY is not configured");
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const symbol = url.searchParams.get("symbol") || "";
    const exchange = url.searchParams.get("exchange") || undefined;

    let body: unknown;
    switch (action) {
      case "search": {
        const q = url.searchParams.get("q") || "";
        if (!q.trim()) { body = []; break; }
        body = await search(q.trim());
        break;
      }
      case "quote":
        body = await quote(symbol, exchange);
        break;
      case "history": {
        const range = (url.searchParams.get("range") || "1M") as RangeKey;
        body = await history(symbol, exchange, range);
        break;
      }
      case "news": {
        const name = url.searchParams.get("name") || symbol;
        body = newsFor(symbol, name);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stocks] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
