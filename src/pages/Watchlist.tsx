import { Link } from "react-router-dom";
import { Star, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import StockCard from "@/components/StockCard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { popularStocks } from "@/data/dummyData";

const Watchlist = () => {
  const { symbols } = useWatchlist();
  const stocks = popularStocks.filter((s) => symbols.includes(s.symbol));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Your Watchlist</h1>
            <p className="text-sm text-muted-foreground">
              {stocks.length === 0 ? "No stocks saved yet" : `${stocks.length} stock${stocks.length > 1 ? "s" : ""} tracked`}
            </p>
          </div>
        </div>

        {stocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Star className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">No stocks watched yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the ⭐ icon on any stock to track it here. Start by exploring popular stocks.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Search className="h-4 w-4" /> Browse stocks
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 animate-fade-in sm:grid-cols-2 lg:grid-cols-3">
            {stocks.map((s) => (
              <StockCard key={s.symbol} {...s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Watchlist;
