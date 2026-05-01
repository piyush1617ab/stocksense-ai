import { useState, useEffect, useCallback } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Props {
  symbol: string;
  currentPrice: number;
}

interface AlertRow {
  id: string;
  target_price: number;
  direction: "above" | "below";
}

const PriceAlertButton = ({ symbol, currentPrice }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [price, setPrice] = useState("");
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  const reload = useCallback(async () => {
    if (!user) { setAlerts([]); return; }
    const { data } = await supabase
      .from("price_alerts")
      .select("id, target_price, direction")
      .eq("symbol", symbol)
      .eq("triggered", false);
    setAlerts((data ?? []) as AlertRow[]);
  }, [user, symbol]);

  useEffect(() => { reload(); }, [reload]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Sign in to set price alerts");
      return;
    }
    const target = parseFloat(price);
    if (isNaN(target) || target <= 0) return;
    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id,
      symbol,
      target_price: target,
      direction,
    });
    if (error) { toast.error(error.message); return; }
    setPrice("");
    setOpen(false);
    toast.success(`Alert set: ${symbol} ${direction} ₹${target.toLocaleString()}`);
    reload();
  };

  const removeAlert = async (id: string) => {
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast("Alert removed");
    reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
          alerts.length > 0
            ? "border-primary/30 bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <BellRing className="h-4 w-4" />
        <span className="hidden sm:inline">Price Alert</span>
        {alerts.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border bg-card shadow-xl z-50 animate-scale-in p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Set Price Alert for {symbol}</h4>

          {!user ? (
            <p className="text-xs text-muted-foreground">
              <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link> to set price alerts that persist across sessions.
            </p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                {(["below", "above"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      direction === d ? "bg-primary text-primary-foreground" : "border bg-muted text-muted-foreground hover:text-foreground"
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
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Set
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground mb-3">
                Current: ₹{currentPrice.toLocaleString()} • Saved to your account
              </p>

              {alerts.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Active Alerts</p>
                  {alerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-foreground">
                        {a.direction === "below" ? "Below" : "Above"} ₹{Number(a.target_price).toLocaleString()}
                      </span>
                      <button onClick={() => removeAlert(a.id)} className="text-xs text-danger hover:underline">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceAlertButton;
