import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { usePortfolio } from "@/context/PortfolioContext";
import { popularStocks } from "@/data/dummyData";

const Portfolio = () => {
  const { holdings, addHolding, removeHolding, totals } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState(popularStocks[0].symbol);
  const [qty, setQty] = useState(10);
  const [avgPrice, setAvgPrice] = useState(popularStocks[0].price);

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = popularStocks.find((s) => s.symbol === symbol);
    if (!stock || qty <= 0 || avgPrice <= 0) return;
    addHolding({
      symbol: stock.symbol,
      name: stock.name,
      quantity: qty,
      avgPrice,
      currentPrice: stock.price,
    });
    setOpen(false);
    setQty(10);
    setAvgPrice(stock.price);
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

  const positive = totals.pnl >= 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">My Portfolio</h1>
            <p className="mt-1 text-muted-foreground">Track your holdings and overall performance.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            Add Holding
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Invested</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{fmt(totals.invested)}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm">Current Value</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{fmt(totals.current)}</p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${positive ? "bg-success-muted" : "bg-danger-muted"}`}>
            <div className={`flex items-center gap-2 text-sm ${positive ? "text-success" : "text-danger"}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>Total P&amp;L</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${positive ? "text-success" : "text-danger"}`}>
              {positive ? "+" : ""}{fmt(totals.pnl)}
            </p>
            <p className={`text-xs ${positive ? "text-success" : "text-danger"}`}>
              {positive ? "+" : ""}{totals.pnlPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Holdings table */}
        <div className="mt-8 rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Holdings</h2>
          </div>

          {holdings.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Wallet className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No holdings yet. Add your first stock to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Stock</th>
                    <th className="px-5 py-3 font-medium text-right">Qty</th>
                    <th className="px-5 py-3 font-medium text-right">Avg Price</th>
                    <th className="px-5 py-3 font-medium text-right">LTP</th>
                    <th className="px-5 py-3 font-medium text-right">P&amp;L</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const pnl = (h.currentPrice - h.avgPrice) * h.quantity;
                    const pct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
                    const up = pnl >= 0;
                    return (
                      <tr key={h.id} className="border-t">
                        <td className="px-5 py-4">
                          <Link to={`/stock/${h.symbol}`} className="font-semibold text-foreground hover:text-primary">
                            {h.symbol}
                          </Link>
                          <p className="text-xs text-muted-foreground">{h.name}</p>
                        </td>
                        <td className="px-5 py-4 text-right text-foreground">{h.quantity}</td>
                        <td className="px-5 py-4 text-right text-foreground">{fmt(h.avgPrice)}</td>
                        <td className="px-5 py-4 text-right text-foreground">{fmt(h.currentPrice)}</td>
                        <td className={`px-5 py-4 text-right font-medium ${up ? "text-success" : "text-danger"}`}>
                          {up ? "+" : ""}{fmt(pnl)}
                          <div className="text-xs">{up ? "+" : ""}{pct.toFixed(2)}%</div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => removeHolding(h.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-danger"
                            aria-label="Remove holding"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add holding modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add Holding</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onAdd} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Stock</label>
                <select
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value);
                    const s = popularStocks.find((p) => p.symbol === e.target.value);
                    if (s) setAvgPrice(s.price);
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {popularStocks.map((s) => (
                    <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Avg Buy Price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(Number(e.target.value))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                Add to Portfolio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
