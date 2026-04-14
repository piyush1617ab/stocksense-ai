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
      className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 w-full text-left"
    >
      <div>
        <p className="font-semibold text-foreground">{symbol}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground">₹{price.toLocaleString()}</p>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-success" : "text-danger"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{isPositive ? "+" : ""}{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </button>
  );
};

export default StockCard;
