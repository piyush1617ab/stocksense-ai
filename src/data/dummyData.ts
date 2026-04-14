export const popularStocks = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2945.6, change: 32.15, changePercent: 1.1 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3782.4, change: -18.3, changePercent: -0.48 },
  { symbol: "INFY", name: "Infosys", price: 1567.85, change: 12.45, changePercent: 0.8 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1689.2, change: -8.75, changePercent: -0.52 },
  { symbol: "ITC", name: "ITC Limited", price: 468.35, change: 5.6, changePercent: 1.21 },
  { symbol: "WIPRO", name: "Wipro", price: 478.9, change: 3.25, changePercent: 0.68 },
];

export const stockDetails: Record<string, {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: string;
  trendType: "success" | "danger" | "neutral";
  rsi: number;
  movingAvg: number;
  aiExplanation: string;
  news: { title: string; source: string; time: string }[];
}> = {
  RELIANCE: {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 2945.6,
    change: 32.15,
    changePercent: 1.1,
    trend: "Bullish",
    trendType: "success",
    rsi: 62,
    movingAvg: 2890,
    aiExplanation:
      "Reliance Industries is showing strong bullish momentum driven by its growing digital services segment and retail expansion. The stock is trading above its 50-day moving average, indicating positive investor sentiment. For beginners: this means the stock's price has been going up consistently, and most investors are optimistic about its future.",
    news: [
      { title: "Reliance Jio crosses 500M subscribers milestone", source: "Economic Times", time: "2h ago" },
      { title: "Reliance Retail plans 2,000 new stores in FY26", source: "Mint", time: "5h ago" },
      { title: "Oil-to-chemicals margin improves in Q3", source: "MoneyControl", time: "8h ago" },
      { title: "Reliance announces green energy investment", source: "Business Standard", time: "1d ago" },
    ],
  },
  TCS: {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3782.4,
    change: -18.3,
    changePercent: -0.48,
    trend: "Bearish",
    trendType: "danger",
    rsi: 38,
    movingAvg: 3820,
    aiExplanation:
      "TCS is experiencing mild bearish pressure due to concerns over IT spending slowdown globally. The RSI below 40 suggests the stock might be nearing oversold territory. For beginners: the stock price is declining slightly, which could present a buying opportunity if the company fundamentals remain strong.",
    news: [
      { title: "TCS wins $500M deal from European bank", source: "Mint", time: "3h ago" },
      { title: "IT sector faces headwinds from US policy changes", source: "Reuters", time: "6h ago" },
      { title: "TCS quarterly attrition rate drops to 12%", source: "Economic Times", time: "1d ago" },
    ],
  },
  INFY: {
    symbol: "INFY",
    name: "Infosys",
    price: 1567.85,
    change: 12.45,
    changePercent: 0.8,
    trend: "Neutral",
    trendType: "neutral",
    rsi: 52,
    movingAvg: 1555,
    aiExplanation:
      "Infosys is trading in a neutral range with balanced buying and selling pressure. The RSI near 50 indicates neither overbought nor oversold conditions. For beginners: the stock is moving sideways without a clear direction, which often means the market is waiting for new information before deciding.",
    news: [
      { title: "Infosys raises revenue guidance for FY26", source: "MoneyControl", time: "4h ago" },
      { title: "Infosys partners with ServiceNow for AI solutions", source: "Business Standard", time: "1d ago" },
      { title: "Infosys Finacle platform adopted by 5 new banks", source: "Mint", time: "2d ago" },
    ],
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    price: 1689.2,
    change: -8.75,
    changePercent: -0.52,
    trend: "Bearish",
    trendType: "danger",
    rsi: 42,
    movingAvg: 1710,
    aiExplanation:
      "HDFC Bank is slightly under pressure post-merger integration. Trading below its 50-day moving average suggests cautious sentiment. For beginners: after merging with HDFC Ltd, the bank is still adjusting, and the stock reflects short-term uncertainty—but the long-term outlook remains positive.",
    news: [
      { title: "HDFC Bank merger synergies ahead of schedule", source: "Economic Times", time: "2h ago" },
      { title: "RBI policy keeps rates unchanged, banks steady", source: "Reuters", time: "1d ago" },
      { title: "HDFC Bank digital transactions up 40% YoY", source: "Mint", time: "2d ago" },
    ],
  },
  ITC: {
    symbol: "ITC",
    name: "ITC Limited",
    price: 468.35,
    change: 5.6,
    changePercent: 1.21,
    trend: "Bullish",
    trendType: "success",
    rsi: 58,
    movingAvg: 460,
    aiExplanation:
      "ITC shows steady bullish momentum driven by strong FMCG growth and hotel segment recovery. The stock is trading above key moving averages. For beginners: ITC is a diversified company doing well across its businesses, and the stock price reflects growing confidence from investors.",
    news: [
      { title: "ITC FMCG segment crosses ₹20,000Cr revenue", source: "Business Standard", time: "3h ago" },
      { title: "ITC hotels demerger approved by shareholders", source: "Economic Times", time: "1d ago" },
      { title: "ITC cigarette volumes show recovery", source: "MoneyControl", time: "2d ago" },
    ],
  },
  WIPRO: {
    symbol: "WIPRO",
    name: "Wipro",
    price: 478.9,
    change: 3.25,
    changePercent: 0.68,
    trend: "Neutral",
    trendType: "neutral",
    rsi: 48,
    movingAvg: 475,
    aiExplanation:
      "Wipro is consolidating around current levels with modest upward movement. The company is undergoing strategic restructuring under new leadership. For beginners: the stock isn't moving much either way, which suggests investors are in 'wait and watch' mode.",
    news: [
      { title: "Wipro wins AI transformation deal worth $300M", source: "Mint", time: "5h ago" },
      { title: "Wipro reorganizes into 4 strategic business units", source: "Economic Times", time: "1d ago" },
      { title: "Wipro campus hiring resumes for FY26", source: "Business Standard", time: "3d ago" },
    ],
  },
};
