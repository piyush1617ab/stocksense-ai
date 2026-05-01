import { Star } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  symbol: string;
  size?: "sm" | "md";
  variant?: "ghost" | "filled";
  stopPropagation?: boolean;
}

const WatchlistButton = ({ symbol, size = "md", variant = "ghost", stopPropagation = true }: Props) => {
  const { isWatched, toggle } = useWatchlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const watched = isWatched(symbol);

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!user) {
      toast.info("Sign in to save your watchlist");
      navigate("/login");
      return;
    }
    toggle(symbol);
    toast.success(watched ? `Removed ${symbol} from watchlist` : `Added ${symbol} to watchlist`);
  };

  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const base =
    variant === "filled"
      ? "border bg-card shadow-sm hover:bg-accent/20"
      : "hover:bg-accent/20";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={watched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
      className={`inline-flex items-center justify-center rounded-lg transition-colors ${dim} ${base} ${
        watched ? "text-warning" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Star className={`${icon} ${watched ? "fill-current" : ""}`} />
    </button>
  );
};

export default WatchlistButton;
