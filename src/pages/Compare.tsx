import { useState } from "react";
import { ArrowLeftRight, Plus, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sparkline from "@/components/charts/Sparkline";
import { popularStocks, stockDetails } from "@/data/dummyData";

const allSymbols = popularStocks.map((s) => s.symbol);

const Compare = () => {
  const [selected, setSelected] = useState<string[]>(["RELIANCE", "TCS"]);
  const [adding, setAdding] = useState(false);

  const addStock = (sym: string) => {
    if (selected.length < 3 && !selected.includes(sym)) {
      setSelected([...selected, sym]);
    }
    setAdding(false);
  };

  const removeStock = (sym: string) => {
    setSelected(selected.filter((s) => s !== sym));
  };

  const stocks = selected.map((sym) => stockDetails[sym]).filter(Boolean);

  const metrics: { label: string; key: string; render: (s: typeof stocks[0]) => React.ReactNode }[] = [
    {
      label: "Price",
      key: "price",
      render: (s) => <span className="tabular-nums font-semibold">₹{s.price.toLocaleString()}</span>,
    },
    {
      label: "Change",
      key: "change",
      render: (s) => (
        <span className={`tabular-nums font-medium ${s.change >= 0 ? "text-success" : "text-danger"}`}>
          {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)} ({s.changePercent.toFixed(2)}%)
        </span>
      ),
    },
    {
      label: "Trend",
      key: "trend",
      render: (s) => {
        const Icon = s.trendType === "success" ? TrendingUp : s.trendType === "danger" ? TrendingDown : Minus;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            s.trendType === "success" ? "bg-success-muted text-success" : s.trendType === "danger" ? "bg-danger-muted text-danger" : "bg-muted text-muted-foreground"
          }`}>
            <Icon className="h-3 w-3" /> {s.trend}
          </span>
        );
      },
    },
    {
      label: "RSI (14)",
      key: "rsi",
      render: (s) => {
        const color = s.rsi > 70 ? "text-danger" : s.rsi < 30 ? "text-success" : "text-foreground";
        return <span className={`tabular-nums font-medium ${color}`}>{s.rsi}</span>;
      },
    },
    {
      label: "50-Day MA",
      key: "ma",
      render: (s) => <span className="tabular-nums">₹{s.movingAvg.toLocaleString()}</span>,
    },
    {
      label: "Price vs MA",
      key: "pvma",
      render: (s) => {
        const above = s.price > s.movingAvg;
        return (
          <span className={`text-xs font-medium ${above ? "text-success" : "text-danger"}`}>
            {above ? "Above" : "Below"} ({((s.price - s.movingAvg) / s.movingAvg * 100).toFixed(1)}%)
          </span>
        );
      },
    },
    {
      label: "7-Day Chart",
      key: "chart",
      render: (s) => <Sparkline seed={s.symbol} positive={s.change >= 0} width={100} height={32} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <ArrowLeftRight className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compare Stocks</h1>
            <p className="text-sm text-muted-foreground">Side-by-side analysis of up to 3 stocks</p>
          </div>
        </div>

        {/* Stock selector chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {selected.map((sym) => (
            <div key={sym} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {sym.slice(0, 2)}
              </div>
              <span className="text-sm font-semibold text-foreground">{sym}</span>
              <button onClick={() => removeStock(sym)} className="ml-1 text-muted-foreground hover:text-danger transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {selected.length < 3 && (
            <div className="relative">
              <button
                onClick={() => setAdding(!adding)}
                className="flex items-center gap-1.5 rounded-xl border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Stock
              </button>
              {adding && (
                <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border bg-card shadow-xl overflow-hidden animate-scale-in">
                  {allSymbols.filter((s) => !selected.includes(s)).map((sym) => (
                    <button
                      key={sym}
                      onClick={() => addStock(sym)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <span className="font-semibold text-foreground">{sym}</span>
                      <span className="text-xs text-muted-foreground">{popularStocks.find((s) => s.symbol === sym)?.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison table */}
        {stocks.length >= 2 ? (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Metric</th>
                    {stocks.map((s) => (
                      <th key={s.symbol} className="px-5 py-3 text-center text-sm font-semibold text-foreground">
                        {s.symbol}
                        <p className="text-xs font-normal text-muted-foreground">{s.name}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr key={m.key} className={i % 2 === 0 ? "" : "bg-muted/10"}>
                      <td className="px-5 py-3.5 text-sm font-medium text-muted-foreground">{m.label}</td>
                      {stocks.map((s) => (
                        <td key={s.symbol} className="px-5 py-3.5 text-center text-sm">
                          <div className="flex justify-center">{m.render(s)}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
            <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Select at least 2 stocks to compare</p>
          </div>
        )}

        {/* AI summary */}
        {stocks.length >= 2 && (
          <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
            <h3 className="text-sm font-semibold text-foreground mb-2">📊 Quick Comparison Summary</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {stocks[0].symbol} is currently{" "}
              <span className={stocks[0].trendType === "success" ? "text-success font-medium" : stocks[0].trendType === "danger" ? "text-danger font-medium" : ""}>
                {stocks[0].trend.toLowerCase()}
              </span>{" "}
              while {stocks[1].symbol} is{" "}
              <span className={stocks[1].trendType === "success" ? "text-success font-medium" : stocks[1].trendType === "danger" ? "text-danger font-medium" : ""}>
                {stocks[1].trend.toLowerCase()}
              </span>.
              {stocks[0].rsi > stocks[1].rsi
                ? ` ${stocks[0].symbol} has a higher RSI (${stocks[0].rsi}) suggesting stronger momentum.`
                : ` ${stocks[1].symbol} has a higher RSI (${stocks[1].rsi}) suggesting stronger momentum.`}
              {stocks[2] ? ` ${stocks[2].symbol} shows ${stocks[2].trend.toLowerCase()} signals with RSI at ${stocks[2].rsi}.` : ""}
            </p>
            <p className="mt-3 text-xs text-muted-foreground italic">
              💡 This is a simplified comparison. Always consider your risk appetite and do thorough research before investing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
