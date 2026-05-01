import { useEffect, useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { stocksApi } from "@/lib/stocksApi";
import { USE_MOCKS } from "@/lib/api";
import { popularStocks } from "@/data/dummyData";

const SearchBar = ({ large = false }: { large?: boolean }) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  // Debounce typing to keep API quota healthy.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["stock-search", debounced],
    enabled: debounced.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      if (USE_MOCKS) {
        const q = debounced.toLowerCase();
        return popularStocks
          .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
          .map((s) => ({ symbol: s.symbol, name: s.name, exchange: "NSE", country: "India" }));
      }
      return stocksApi.search(debounced);
    },
  });

  const handleSelect = (symbol: string, exchange: string) => {
    navigate(`/stock/${encodeURIComponent(symbol)}?ex=${encodeURIComponent(exchange)}`);
    setQuery("");
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) handleSelect(results[0].symbol, results[0].exchange);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center gap-3 rounded-2xl border bg-card shadow-sm transition-all duration-200 ${
            large ? "px-5 py-4" : "px-4 py-3"
          } ${isFocused ? "ring-2 ring-primary/20 shadow-lg border-primary/30" : "hover:shadow-md"}`}
        >
          <Search className={`text-muted-foreground ${large ? "h-5 w-5" : "h-4 w-4"}`} />
          <input
            type="text"
            placeholder="Search any stock (NSE, BSE, NYSE, NASDAQ)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className={`flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none ${
              large ? "text-base" : "text-sm"
            }`}
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-primary-foreground transition-transform hover:scale-105"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {isFocused && debounced.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border bg-card shadow-xl overflow-hidden z-50 animate-scale-in max-h-96 overflow-y-auto">
          {results.length === 0 && !isFetching && (
            <div className="px-5 py-4 text-sm text-muted-foreground">No matches for "{debounced}"</div>
          )}
          {results.map((s) => (
            <button
              key={`${s.symbol}-${s.exchange}`}
              onMouseDown={() => handleSelect(s.symbol, s.exchange)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-sm hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                  {s.symbol.slice(0, 2)}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-foreground truncate">{s.symbol}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.name}</p>
                </div>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-muted-foreground shrink-0 ml-2">
                {s.exchange}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
