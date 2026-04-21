import { useState, useEffect } from "react";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  symbol: string;
  currentPrice: number;
}

interface PriceAlert {
  symbol: string;
  targetPrice: number;
  direction: "above" | "below";
}

const STORAGE_KEY = "stocksense_price_alerts";

const getAlerts = (): PriceAlert[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveAlerts = (alerts: PriceAlert[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
};

const PriceAlertButton = ({ symbol, currentPrice }: Props) => {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [price, setPrice] = useState("");
  const [existingAlerts, setExistingAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    setExistingAlerts(getAlerts().filter((a) => a.symbol === symbol));
  }, [symbol]);

  const handleSave = () => {
    const target = parseFloat(price);
    if (isNaN(target) || target <= 0) return;

    const all = getAlerts();
    const newAlert: PriceAlert = { symbol, targetPrice: target, direction };
    const updated = [...all.filter((a) => !(a.symbol === symbol && a.direction === direction && a.targetPrice === target)), newAlert];
    saveAlerts(updated);
    setExistingAlerts(updated.filter((a) => a.symbol === symbol));
    setPrice("");
    setOpen(false);
    toast.success(`Alert set: ${symbol} ${direction} ₹${target.toLocaleString()}`);
  };

  const removeAlert = (alert: PriceAlert) => {
    const all = getAlerts().filter(
      (a) => !(a.symbol === alert.symbol && a.direction === alert.direction && a.targetPrice === alert.targetPrice)
    );
    saveAlerts(all);
    setExistingAlerts(all.filter((a) => a.symbol === symbol));
    toast("Alert removed");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
          existingAlerts.length > 0
            ? "border-primary/30 bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <BellRing className="h-4 w-4" />
        <span className="hidden sm:inline">Price Alert</span>
        {existingAlerts.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {existingAlerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border bg-card shadow-xl z-50 animate-scale-in p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Set Price Alert for {symbol}</h4>

          <div className="flex gap-2 mb-3">
            {(["below", "above"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  direction === d ? "gradient-primary text-primary-foreground" : "border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "below" ? "Drops below" : "Goes above"}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-1 rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={currentPrice.toFixed(0)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none tabular-nums"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!price}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Set
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground mb-3">
            Current price: ₹{currentPrice.toLocaleString()} • Alerts are stored locally
          </p>

          {existingAlerts.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Active Alerts</p>
              {existingAlerts.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-xs text-foreground">
                    {a.direction === "below" ? "Below" : "Above"} ₹{a.targetPrice.toLocaleString()}
                  </span>
                  <button onClick={() => removeAlert(a)} className="text-xs text-danger hover:underline">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceAlertButton;
