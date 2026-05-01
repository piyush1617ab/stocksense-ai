import { z } from "zod";

export const StockSummarySchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  sector: z.string().optional(),
});
export type StockSummary = z.infer<typeof StockSummarySchema>;

export const NewsItemSchema = z.object({
  title: z.string(),
  source: z.string(),
  time: z.string(),
  url: z.string().url().optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const StockDetailSchema = StockSummarySchema.extend({
  trend: z.string(),
  trendType: z.enum(["success", "danger", "neutral"]),
  rsi: z.number(),
  movingAvg: z.number(),
  aiExplanation: z.string(),
  news: z.array(NewsItemSchema),
});
export type StockDetail = z.infer<typeof StockDetailSchema>;

export const PricePointSchema = z.object({
  date: z.string(),
  close: z.number(),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

export const TimeRangeSchema = z.enum(["1D", "1W", "1M", "1Y", "5Y"]);
export type TimeRange = z.infer<typeof TimeRangeSchema>;
