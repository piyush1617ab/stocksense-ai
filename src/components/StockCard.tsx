import { TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <button
      onClick={() => navigate(`/stock/${symbol}`)}
      className="group flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 w-full text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
          {symbol.slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-foreground">{symbol}</p>
          <p className="text-xs text-muted-foreground">{name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground tabular-nums">₹{price.toLocaleString()}</p>
        <div className={`flex items-center justify-end gap-1 text-xs font-medium ${isPositive ? "text-success" : "text-danger"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span className="tabular-nums">
            {isPositive ? "+" : ""}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </button>
  );
};

export default StockCard;
