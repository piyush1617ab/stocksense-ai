// Edge function proxy for stock data.
// - NSE / BSE  -> Yahoo Finance (free, no key) using .NS / .BO suffixes
// - Other exchanges -> Twelve Data (uses TWELVE_DATA_API_KEY)
// Routes:
//   GET /stocks?action=search&q=reliance
//   GET /stocks?action=quote&symbol=RELIANCE&exchange=NSE
//   GET /stocks?action=history&symbol=RELIANCE&exchange=NSE&range=1M
//   GET /stocks?action=news&symbol=RELIANCE&name=Reliance%20Industries
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TD = "https://api.twelvedata.com";
const KEY = Deno.env.get("TWELVE_DATA_API_KEY");
const YF_QUOTE = "https://query1.finance.yahoo.com/v7/finance/quote";
const YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const YF_SEARCH = "https://query2.finance.yahoo.com/v1/finance/search";
const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

type RangeKey = "1D" | "1W" | "1M" | "1Y" | "5Y";

const TD_RANGE: Record<RangeKey, { interval: string; outputsize: number }> = {
  "1D": { interval: "15min", outputsize: 32 },
  "1W": { interval: "1h", outputsize: 56 },
  "1M": { interval: "1day", outputsize: 30 },
  "1Y": { interval: "1week", outputsize: 52 },
  "5Y": { interval: "1month", outputsize: 60 },
};

const YF_RANGE: Record<RangeKey, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "15m" },
  "1W": { range: "5d", interval: "60m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  "5Y": { range: "5y", interval: "1mo" },
};

const isIndian = (exchange?: string) => {
  const ex = (exchange || "").toUpperCase();
  return ex === "NSE" || ex === "BSE";
};

const yfSymbol = (symbol: string, exchange?: string) => {
  const ex = (exchange || "NSE").toUpperCase();
  const base = symbol.toUpperCase().replace(/\.(NS|BO)$/i, "");
  return ex === "BSE" ? `${base}.BO` : `${base}.NS`;
};

async function tdFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${TD}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", KEY!);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data?.status === "error") throw new Error(data.message || "Twelve Data error");
  return data;
}

// ---------- SEARCH ----------
async function search(q: string) {
  // Try Twelve Data first (broad global coverage incl. NSE/BSE listings).
  try {
    const data = await tdFetch("/symbol_search", { symbol: q, outputsize: "25" });
    const list = (data?.data || []) as Array<{
      symbol: string;
      instrument_name: string;
      exchange: string;
      country: string;
      instrument_type?: string;
    }>;
    if (list.length) {
      return list
        .filter((s) => !s.instrument_type || s.instrument_type.toLowerCase().includes("stock"))
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
    }
  } catch (e) {
    console.warn("[search] td failed, falling back to yahoo:", (e as Error).message);
  }
  // Fallback: Yahoo search.
  const url = new URL(YF_SEARCH);
  url.searchParams.set("q", q);
  url.searchParams.set("quotesCount", "20");
  const res = await fetch(url.toString(), { headers: UA });
  const data = await res.json();
  const quotes = (data?.quotes || []) as Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    exchDisp?: string;
    quoteType?: string;
  }>;
  return quotes
    .filter((q) => q.quoteType === "EQUITY")
    .map((q) => {
      let exchange = q.exchDisp || q.exchange || "";
      if (q.symbol.endsWith(".NS")) exchange = "NSE";
      else if (q.symbol.endsWith(".BO")) exchange = "BSE";
      return {
        symbol: q.symbol.replace(/\.(NS|BO)$/i, ""),
        name: q.longname || q.shortname || q.symbol,
        exchange,
      };
    });
}

// ---------- QUOTE ----------
async function quoteYahooSymbol(ySym: string, displaySymbol: string, exchange: string) {
  const url = `${YF_CHART}/${encodeURIComponent(ySym)}?range=1d&interval=1d`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`Yahoo quote ${res.status}`);
  const data = await res.json();
  const r = data?.chart?.result?.[0];
  const m = r?.meta;
  if (!m) throw new Error(`No data for ${ySym}`);
  const price = Number(m.regularMarketPrice ?? 0);
  const prev = Number(m.chartPreviousClose ?? m.previousClose ?? price);
  const change = price - prev;
  return {
    symbol: displaySymbol.toUpperCase(),
    name: m.longName || m.shortName || displaySymbol.toUpperCase(),
    exchange,
    price,
    change,
    changePercent: prev ? (change / prev) * 100 : 0,
    high: Number(m.regularMarketDayHigh ?? price),
    low: Number(m.regularMarketDayLow ?? price),
    open: Number(m.regularMarketOpen ?? price),
    volume: Number(m.regularMarketVolume ?? 0),
    fiftyTwoWeek:
      m.fiftyTwoWeekHigh && m.fiftyTwoWeekLow
        ? { high: Number(m.fiftyTwoWeekHigh), low: Number(m.fiftyTwoWeekLow) }
        : undefined,
    currency: m.currency || "INR",
  };
}

async function quoteYahoo(symbol: string, exchange: string) {
  const primary = yfSymbol(symbol, exchange);
  try {
    return await quoteYahooSymbol(primary, symbol, exchange);
  } catch (e) {
    // Some Indian stocks are only listed on one exchange — try the other.
    if (exchange === "NSE" || exchange === "BSE") {
      const altEx = exchange === "NSE" ? "BSE" : "NSE";
      const alt = yfSymbol(symbol, altEx);
      console.warn(`[quote] ${primary} failed (${(e as Error).message}), trying ${alt}`);
      return await quoteYahooSymbol(alt, symbol, altEx);
    }
    throw e;
  }
}

async function quoteTD(symbol: string, exchange?: string) {
  const sym = `${symbol.toUpperCase()}:${(exchange || "NASDAQ").toUpperCase()}`;
  const q = await tdFetch("/quote", { symbol: sym });
  const price = parseFloat(q.close);
  const prev = parseFloat(q.previous_close);
  const change = price - prev;
  return {
    symbol: q.symbol?.split(":")[0] ?? symbol.toUpperCase(),
    name: q.name ?? symbol.toUpperCase(),
    exchange: q.exchange ?? exchange ?? "NASDAQ",
    price,
    change,
    changePercent: (change / prev) * 100,
    high: parseFloat(q.high),
    low: parseFloat(q.low),
    open: parseFloat(q.open),
    volume: parseInt(q.volume ?? "0", 10),
    fiftyTwoWeek: q.fifty_two_week
      ? { high: parseFloat(q.fifty_two_week.high), low: parseFloat(q.fifty_two_week.low) }
      : undefined,
    currency: q.currency ?? "USD",
  };
}

async function quote(symbol: string, exchange?: string) {
  if (isIndian(exchange)) return quoteYahoo(symbol, (exchange || "NSE").toUpperCase());
  // Try Twelve Data, fall back to Yahoo if blocked by plan.
  try {
    return await quoteTD(symbol, exchange);
  } catch (e) {
    console.warn("[quote] td failed, falling back to yahoo:", (e as Error).message);
    return quoteYahoo(symbol, exchange || "NASDAQ");
  }
}

// ---------- HISTORY ----------
async function historyYahooSymbol(ySym: string, range: RangeKey) {
  const cfg = YF_RANGE[range] ?? YF_RANGE["1M"];
  const url = `${YF_CHART}/${encodeURIComponent(ySym)}?range=${cfg.range}&interval=${cfg.interval}`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`Yahoo chart ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No history for ${ySym}`);
  const ts: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
  return ts
    .map((t, i) => ({ date: new Date(t * 1000).toISOString(), close: closes[i] }))
    .filter((p): p is { date: string; close: number } => typeof p.close === "number");
}

async function historyYahoo(symbol: string, exchange: string, range: RangeKey) {
  const primary = yfSymbol(symbol, exchange);
  try {
    return await historyYahooSymbol(primary, range);
  } catch (e) {
    if (exchange === "NSE" || exchange === "BSE") {
      const alt = yfSymbol(symbol, exchange === "NSE" ? "BSE" : "NSE");
      console.warn(`[history] ${primary} failed (${(e as Error).message}), trying ${alt}`);
      return await historyYahooSymbol(alt, range);
    }
    throw e;
  }
}

async function historyTD(symbol: string, exchange: string | undefined, range: RangeKey) {
  const sym = `${symbol.toUpperCase()}:${(exchange || "NASDAQ").toUpperCase()}`;
  const cfg = TD_RANGE[range] ?? TD_RANGE["1M"];
  const data = await tdFetch("/time_series", {
    symbol: sym,
    interval: cfg.interval,
    outputsize: String(cfg.outputsize),
    order: "ASC",
  });
  const values = (data?.values || []) as Array<{ datetime: string; close: string }>;
  return values.map((v) => ({ date: new Date(v.datetime).toISOString(), close: parseFloat(v.close) }));
}

async function history(symbol: string, exchange: string | undefined, range: RangeKey) {
  if (isIndian(exchange)) return historyYahoo(symbol, (exchange || "NSE").toUpperCase(), range);
  try {
    return await historyTD(symbol, exchange, range);
  } catch (e) {
    console.warn("[history] td failed, falling back to yahoo:", (e as Error).message);
    return historyYahoo(symbol, exchange || "NASDAQ", range);
  }
}

// ---------- NEWS (Yahoo Finance — real article links) ----------
async function newsFor(symbol: string, name: string, exchange?: string) {
  // Try Yahoo Finance first — gives direct article URLs to the actual sources.
  const ySym = isIndian(exchange) ? yfSymbol(symbol, exchange) : symbol.toUpperCase();
  try {
    const url = new URL(YF_SEARCH);
    url.searchParams.set("q", ySym);
    url.searchParams.set("newsCount", "12");
    url.searchParams.set("quotesCount", "0");
    const res = await fetch(url.toString(), { headers: UA });
    if (res.ok) {
      const data = await res.json();
      const news = (data?.news || []) as Array<{
        title: string;
        publisher?: string;
        link?: string;
        providerPublishTime?: number;
      }>;
      const items = news
        .filter((n) => n.link && n.title)
        .map((n) => {
          const ts = n.providerPublishTime ? n.providerPublishTime * 1000 : Date.now();
          const ageMin = Math.max(1, Math.round((Date.now() - ts) / 60000));
          const time =
            ageMin < 60 ? `${ageMin}m ago`
              : ageMin < 1440 ? `${Math.round(ageMin / 60)}h ago`
              : `${Math.round(ageMin / 1440)}d ago`;
          return {
            title: n.title,
            source: n.publisher || "News",
            time,
            url: n.link as string,
          };
        });
      if (items.length) return items;
    }
  } catch (e) {
    console.warn("[news] yahoo failed:", (e as Error).message);
  }
  // Fallback: Google News search redirects (each opens directly to a real article).
  const q = encodeURIComponent(`${name} ${symbol} stock`);
  return [
    { source: "Economic Times", host: "economictimes.indiatimes.com" },
    { source: "Mint", host: "livemint.com" },
    { source: "MoneyControl", host: "moneycontrol.com" },
    { source: "Business Standard", host: "business-standard.com" },
    { source: "Reuters", host: "reuters.com" },
  ].map((s) => ({
    title: `Latest ${name} news on ${s.source}`,
    source: s.source,
    time: "Live",
    url: `https://news.google.com/search?q=${q}+site%3A${s.host}`,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const symbol = url.searchParams.get("symbol") || "";
    const exchange = url.searchParams.get("exchange") || undefined;

    let body: unknown;
    switch (action) {
      case "search": {
        const q = url.searchParams.get("q") || "";
        body = q.trim() ? await search(q.trim()) : [];
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
        body = await newsFor(symbol, name, exchange);
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
