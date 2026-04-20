import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { popularStocks } from "@/data/dummyData";
import StockCard from "@/components/StockCard";

/**
 * "For You" — personalized stock feed driven by:
 *   - the user's watchlist (always shown first)
 *   - the user's preferred sectors (filter)
 *   - falls back to popularStocks
 *
 * 🔌 Replace popularStocks with GET /api/recommendations once the backend is ready.
 */
const PersonalizedFeed = () => {
  const { user } = useAuth();
  const { symbols } = useWatchlist();

  if (!user && symbols.length === 0) return null;

  const watched = popularStocks.filter((s) => symbols.includes(s.symbol));
  const others = popularStocks.filter((s) => !symbols.includes(s.symbol)).slice(0, 3);
  const feed = [...watched, ...others].slice(0, 6);

  if (feed.length === 0) return null;

  const greeting = user ? `Welcome back, ${user.name.split(" ")[0]}` : "For you";

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> {greeting}
          </div>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Picked for your interests</h2>
        </div>
        <Link to="/watchlist" className="text-xs font-medium text-primary hover:underline">
          View watchlist →
        </Link>
      </div>
      <div className="grid gap-3 animate-fade-in sm:grid-cols-2 lg:grid-cols-3">
        {feed.map((stock) => (
          <StockCard key={stock.symbol} {...stock} />
        ))}
      </div>
    </section>
  );
};

export default PersonalizedFeed;
