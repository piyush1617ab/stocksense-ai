import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Watchlist hook backed by Supabase. For anonymous users, falls back to
 * an in-memory list (lost on reload) so the UI stays usable.
 */
export const useWatchlist = () => {
  const { user } = useAuth();
  const [symbols, setSymbols] = useState<string[]>([]);

  const reload = useCallback(async () => {
    if (!user) {
      setSymbols([]);
      return;
    }
    const { data, error } = await supabase
      .from("watchlist")
      .select("symbol")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[watchlist] load", error);
      return;
    }
    setSymbols((data ?? []).map((r) => r.symbol.toUpperCase()));
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const isWatched = useCallback(
    (symbol: string) => symbols.includes(symbol.toUpperCase()),
    [symbols],
  );

  const add = useCallback(
    async (symbol: string, exchange: string = "NSE") => {
      const sym = symbol.toUpperCase();
      if (!user) {
        setSymbols((prev) => (prev.includes(sym) ? prev : [...prev, sym]));
        return;
      }
      setSymbols((prev) => (prev.includes(sym) ? prev : [...prev, sym]));
      const { error } = await supabase.from("watchlist").insert({
        user_id: user.id,
        symbol: sym,
        exchange,
      });
      if (error && !error.message.includes("duplicate")) {
        console.error("[watchlist] add", error);
        reload();
      }
    },
    [user, reload],
  );

  const remove = useCallback(
    async (symbol: string) => {
      const sym = symbol.toUpperCase();
      setSymbols((prev) => prev.filter((s) => s !== sym));
      if (!user) return;
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("symbol", sym);
      if (error) {
        console.error("[watchlist] remove", error);
        reload();
      }
    },
    [user, reload],
  );

  const toggle = useCallback(
    (symbol: string, exchange: string = "NSE") => {
      if (isWatched(symbol)) return remove(symbol);
      return add(symbol, exchange);
    },
    [isWatched, add, remove],
  );

  return { symbols, isWatched, toggle, add, remove };
};
