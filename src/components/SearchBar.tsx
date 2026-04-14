import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const suggestions = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "INFY", name: "Infosys", sector: "IT" },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG" },
  { symbol: "WIPRO", name: "Wipro", sector: "IT" },
];

const SearchBar = ({ large = false }: { large?: boolean }) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const filtered = suggestions.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (symbol: string) => {
    navigate(`/stock/${symbol}`);
    setQuery("");
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filtered.length > 0) handleSelect(filtered[0].symbol);
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
            placeholder="Search stocks (e.g., Reliance, TCS, Infosys)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className={`flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none ${
              large ? "text-base" : "text-sm"
            }`}
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-primary-foreground transition-transform hover:scale-105"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {isFocused && query.length > 0 && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border bg-card shadow-xl overflow-hidden z-50 animate-scale-in">
          {filtered.map((s) => (
            <button
              key={s.symbol}
              onMouseDown={() => handleSelect(s.symbol)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-sm hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {s.symbol.slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{s.symbol}</p>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-muted-foreground">{s.sector}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
