export interface GlossaryTerm {
  term: string;
  short: string;
  long: string;
}

/**
 * Beginner-friendly definitions. Keep `short` under ~100 chars for hover cards.
 * Lookup is case-insensitive on the `term` key.
 */
export const GLOSSARY: Record<string, GlossaryTerm> = {
  "p/e": {
    term: "P/E Ratio",
    short: "Price-to-Earnings: how much you pay per ₹1 of yearly profit.",
    long: "P/E = Share price ÷ Earnings per share. A high P/E means investors expect strong future growth; a low P/E may mean the stock is cheap or that growth is slowing.",
  },
  rsi: {
    term: "RSI (Relative Strength Index)",
    short: "Momentum gauge from 0–100. Above 70 = overbought, below 30 = oversold.",
    long: "RSI measures how fast a stock has moved up vs down recently. It helps spot when a stock has run too far in either direction and may pause or reverse.",
  },
  ma: {
    term: "Moving Average",
    short: "Average closing price over the last N days, smoothed.",
    long: "A 50-day MA averages the last 50 closing prices. Price above MA is generally bullish; below MA is generally bearish. Often used as a trend filter.",
  },
  eps: {
    term: "EPS (Earnings Per Share)",
    short: "Company's profit divided by total shares outstanding.",
    long: "EPS shows how much profit each share has earned. Rising EPS over time is one of the strongest signals of business growth.",
  },
  "market cap": {
    term: "Market Capitalization",
    short: "Total value of a company: share price × number of shares.",
    long: "Companies are categorized as large-cap (stable, lower growth), mid-cap (balanced), or small-cap (volatile, higher growth potential).",
  },
  "dividend yield": {
    term: "Dividend Yield",
    short: "Yearly dividend ÷ share price, shown as a %.",
    long: "If a ₹1,000 stock pays ₹30/year in dividends, the yield is 3%. High yields can be attractive but may signal that the share price has fallen.",
  },
  beta: {
    term: "Beta",
    short: "How much a stock moves vs the overall market.",
    long: "Beta = 1 means the stock moves in line with the market. Beta > 1 is more volatile; beta < 1 is less volatile. Useful for matching stocks to your risk appetite.",
  },
  bullish: {
    term: "Bullish",
    short: "Expecting prices to go up.",
    long: "A bullish view or trend means investors expect the price to rise. The opposite is bearish.",
  },
  bearish: {
    term: "Bearish",
    short: "Expecting prices to fall.",
    long: "A bearish view or trend means investors expect the price to drop. The opposite is bullish.",
  },
};

export const lookupTerm = (key: string): GlossaryTerm | undefined => {
  return GLOSSARY[key.toLowerCase()];
};
