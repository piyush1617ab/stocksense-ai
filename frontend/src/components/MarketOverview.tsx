import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MarketIndexProps {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const marketIndices: MarketIndexProps[] = [
  { name: "NIFTY 50", value: 24850.45, change: 182.30, changePercent: 0.74 },
  { name: "SENSEX", value: 81432.15, change: 548.90, changePercent: 0.68 },
  { name: "BANK NIFTY", value: 52190.80, change: -120.55, changePercent: -0.23 },
  { name: "NIFTY IT", value: 38420.65, change: 215.40, changePercent: 0.56 },
];

const MarketOverview = () => {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {marketIndices.map((index) => {
        const isPositive = index.change >= 0;
        return (
          <div
            key={index.name}
            className="rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">{index.name}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {index.value.toLocaleString()}
            </p>
            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isPositive ? "text-success" : "text-danger"}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="tabular-nums">
                {isPositive ? "+" : ""}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketOverview;
