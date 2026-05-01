import { TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sparkline from "@/components/charts/Sparkline";
import WatchlistButton from "@/components/watchlist/WatchlistButton";

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const StockCard = ({ symbol, name, price, change, changePercent }: StockCardProps) => {
  const navigate = useNavigate();
  const isPositive = change >= 0;

  return (
    <div
      onClick={() => navigate(`/stock/${symbol}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/stock/${symbol}`);
        }
      }}
      className="group flex cursor-pointer items-center justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
          {symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground">{symbol}</p>
            <WatchlistButton symbol={symbol} size="sm" />
          </div>
          <p className="truncate text-xs text-muted-foreground">{name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Sparkline seed={symbol} positive={isPositive} />
        <div className="text-right">
          <p className="font-semibold text-foreground tabular-nums">₹{price.toLocaleString()}</p>
          <div
            className={`flex items-center justify-end gap-1 text-xs font-medium ${
              isPositive ? "text-success" : "text-danger"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="tabular-nums">
              {isPositive ? "+" : ""}
              {change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
