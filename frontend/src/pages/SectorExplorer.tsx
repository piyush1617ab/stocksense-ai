import { useState } from "react";
import { Layers, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StockCard from "@/components/StockCard";
import { sectors, getStocksForSector } from "@/data/sectorData";

const SectorExplorer = () => {
  const [activeSector, setActiveSector] = useState(sectors[0].key);
  const active = sectors.find((s) => s.key === activeSector)!;
  const stocks = getStocksForSector(activeSector);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sector Explorer</h1>
            <p className="text-sm text-muted-foreground">Understand industries before you invest</p>
          </div>
        </div>

        {/* Sector tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {sectors.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSector(s.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeSector === s.key
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.name}</span>
              <span className="sm:hidden">{s.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Sector detail */}
        <div className="animate-fade-in space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{active.icon}</span>
              <h2 className="text-xl font-bold text-foreground">{active.name}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{active.description}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">
                {active.symbols.length} stock{active.symbols.length !== 1 ? "s" : ""}
              </span>
              <span>in this sector</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Stocks in {active.name}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  price={stock.price}
                  change={stock.change}
                  changePercent={stock.changePercent}
                />
              ))}
            </div>
          </div>

          {/* Beginner tips */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
            <h3 className="text-sm font-semibold text-foreground mb-2">🎓 Beginner Tip: Sector Analysis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Don't put all your eggs in one basket! Diversifying across sectors can reduce risk.
              For example, when IT stocks dip due to global slowdowns, FMCG stocks often remain stable
              because people still buy essentials. Understanding sectors helps you build a balanced portfolio.
            </p>
            <Link
              to="/learn"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
            >
              Learn more about diversification <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorExplorer;
