import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const suggestions = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "ITC", name: "ITC Limited" },
];

const SearchBar = () => {
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

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow ${
          isFocused ? "ring-2 ring-primary/30 shadow-md" : ""
        }`}
      >
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search stocks (e.g., Reliance, TCS)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {isFocused && query.length > 0 && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-card shadow-lg overflow-hidden z-50">
          {filtered.map((s) => (
            <button
              key={s.symbol}
              onMouseDown={() => handleSelect(s.symbol)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              <span className="font-medium text-foreground">{s.symbol}</span>
              <span className="text-muted-foreground">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
