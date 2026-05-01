import type { PricePoint, TimeRange } from "@/types/api";

const POINTS: Record<TimeRange, number> = {
  "1D": 24,
  "1W": 7 * 8,
  "1M": 30,
  "1Y": 52,
  "5Y": 60,
};

/** Deterministic pseudo-random walk so the same symbol+range always renders the same chart. */
const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const generateHistory = (symbol: string, basePrice: number, range: TimeRange): PricePoint[] => {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + range.length;
  const rand = seeded(seed);
  const n = POINTS[range];
  const volatility = range === "1D" ? 0.005 : range === "1W" ? 0.012 : range === "1M" ? 0.02 : 0.05;

  const data: PricePoint[] = [];
  let price = basePrice * (1 - volatility * 4);
  const now = Date.now();
  const stepMs =
    range === "1D"
      ? 60 * 60 * 1000
      : range === "1W"
        ? 3 * 60 * 60 * 1000
        : range === "1M"
          ? 24 * 60 * 60 * 1000
          : range === "1Y"
            ? 7 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;

  for (let i = n - 1; i >= 0; i--) {
    const drift = (rand() - 0.45) * volatility * basePrice;
    price = Math.max(basePrice * 0.6, price + drift);
    data.push({
      date: new Date(now - i * stepMs).toISOString(),
      close: Number(price.toFixed(2)),
    });
  }
  // Ensure last point is close to current basePrice
  data[data.length - 1] = { date: new Date(now).toISOString(), close: basePrice };
  return data;
};
