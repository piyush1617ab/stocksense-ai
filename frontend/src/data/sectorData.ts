import { stockDetails, popularStocks } from "./dummyData";

export interface SectorInfo {
  key: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  symbols: string[];
}

export const sectors: SectorInfo[] = [
  {
    key: "it",
    name: "Information Technology",
    icon: "💻",
    color: "from-blue-500 to-cyan-400",
    description:
      "IT companies build software, provide consulting, and manage digital infrastructure for businesses worldwide. Indian IT giants like TCS, Infosys, and Wipro earn most of their revenue from the US and Europe. The sector tends to do well when global businesses increase tech spending.",
    symbols: ["TCS", "INFY", "WIPRO"],
  },
  {
    key: "energy",
    name: "Energy & Petrochemicals",
    icon: "⚡",
    color: "from-orange-500 to-yellow-400",
    description:
      "Energy companies refine oil, produce gas, and increasingly invest in renewables. Their profits are closely tied to global crude oil prices. Reliance Industries dominates this space in India, with diversification into telecom and retail adding stability.",
    symbols: ["RELIANCE"],
  },
  {
    key: "banking",
    name: "Banking & Finance",
    icon: "🏦",
    color: "from-emerald-500 to-green-400",
    description:
      "Banks earn money by lending at higher rates than they borrow. HDFC Bank is India's largest private bank. The sector is sensitive to RBI interest rate decisions — lower rates boost lending, while higher rates can slow growth. A healthy banking sector is a sign of a strong economy.",
    symbols: ["HDFCBANK"],
  },
  {
    key: "fmcg",
    name: "FMCG (Consumer Goods)",
    icon: "🛒",
    color: "from-pink-500 to-rose-400",
    description:
      "Fast-Moving Consumer Goods companies sell everyday products — food, personal care, cigarettes. ITC is a major player. FMCG stocks are considered 'defensive' because people buy essentials regardless of the economy. They offer steady, predictable growth.",
    symbols: ["ITC"],
  },
];

export const getSectorForSymbol = (symbol: string): SectorInfo | undefined =>
  sectors.find((s) => s.symbols.includes(symbol.toUpperCase()));

export const getStocksForSector = (sectorKey: string) => {
  const sector = sectors.find((s) => s.key === sectorKey);
  if (!sector) return [];
  return sector.symbols.map((sym) => {
    const detail = stockDetails[sym];
    const summary = popularStocks.find((s) => s.symbol === sym);
    return detail || summary || { symbol: sym, name: sym, price: 0, change: 0, changePercent: 0 };
  });
};
