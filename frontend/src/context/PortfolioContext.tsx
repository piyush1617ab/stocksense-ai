import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface PortfolioContextValue {
  holdings: Holding[];
  loading: boolean;
  addHolding: (h: Omit<Holding, "id">) => Promise<void>;
  removeHolding: (id: string) => Promise<void>;
  updateHolding: (id: string, patch: Partial<Holding>) => Promise<void>;
  totals: { invested: number; current: number; pnl: number; pnlPercent: number };
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

interface HoldingRow {
  id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  notes: string | null;
}

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setHoldings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_holdings")
      .select("id, symbol, quantity, avg_price, notes")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[portfolio] load", error);
    } else {
      setHoldings(
        (data ?? []).map((r: HoldingRow) => ({
          id: r.id,
          symbol: r.symbol,
          name: r.notes || r.symbol,
          quantity: Number(r.quantity),
          avgPrice: Number(r.avg_price),
          currentPrice: Number(r.avg_price), // updated by useStock when shown
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const addHolding = async (h: Omit<Holding, "id">) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("portfolio_holdings")
      .insert({
        user_id: user.id,
        symbol: h.symbol.toUpperCase(),
        quantity: h.quantity,
        avg_price: h.avgPrice,
        notes: h.name,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[portfolio] add", error);
      return;
    }
    setHoldings((prev) => [{ ...h, id: data.id }, ...prev]);
  };

  const removeHolding = async (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
    const { error } = await supabase.from("portfolio_holdings").delete().eq("id", id);
    if (error) { console.error("[portfolio] remove", error); reload(); }
  };

  const updateHolding = async (id: string, patch: Partial<Holding>) => {
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
    const dbPatch: { quantity?: number; avg_price?: number; notes?: string } = {};
    if (patch.quantity !== undefined) dbPatch.quantity = patch.quantity;
    if (patch.avgPrice !== undefined) dbPatch.avg_price = patch.avgPrice;
    if (patch.name !== undefined) dbPatch.notes = patch.name;
    if (Object.keys(dbPatch).length === 0) return;
    const { error } = await supabase.from("portfolio_holdings").update(dbPatch).eq("id", id);
    if (error) { console.error("[portfolio] update", error); reload(); }
  };

  const invested = holdings.reduce((s, h) => s + h.quantity * h.avgPrice, 0);
  const current = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const pnl = current - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

  return (
    <PortfolioContext.Provider
      value={{ holdings, loading, addHolding, removeHolding, updateHolding, totals: { invested, current, pnl, pnlPercent } }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
};
