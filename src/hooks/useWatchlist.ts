import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * 🔌 BACKEND INTEGRATION POINT
 * Replace localStorage with:
 *   GET    /api/watchlist           → string[]
 *   POST   /api/watchlist  { symbol }
 *   DELETE /api/watchlist/:symbol
 *
 * Then convert to TanStack Query (useQuery + useMutation) so optimistic
 * updates work identically.
 */

const KEY_FOR = (userId: string | null) => `stocksense_watchlist_${userId ?? "guest"}`;

const read = (userId: string | null): string[] => {
  try {
    const raw = localStorage.getItem(KEY_FOR(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const write = (userId: string | null, symbols: string[]) => {
  try {
    localStorage.setItem(KEY_FOR(userId), JSON.stringify(symbols));
  } catch {
    // ignore
  }
};

export const useWatchlist = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [symbols, setSymbols] = useState<string[]>(() => read(userId));

  useEffect(() => {
    setSymbols(read(userId));
  }, [userId]);

  const isWatched = useCallback((symbol: string) => symbols.includes(symbol.toUpperCase()), [symbols]);

  const toggle = useCallback(
    (symbol: string) => {
      const sym = symbol.toUpperCase();
      setSymbols((prev) => {
        const next = prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym];
        write(userId, next);
        return next;
      });
    },
    [userId],
  );

  const add = useCallback(
    (symbol: string) => {
      const sym = symbol.toUpperCase();
      setSymbols((prev) => {
        if (prev.includes(sym)) return prev;
        const next = [...prev, sym];
        write(userId, next);
        return next;
      });
    },
    [userId],
  );

  const remove = useCallback(
    (symbol: string) => {
      const sym = symbol.toUpperCase();
      setSymbols((prev) => {
        const next = prev.filter((s) => s !== sym);
        write(userId, next);
        return next;
      });
    },
    [userId],
  );

  return { symbols, isWatched, toggle, add, remove };
};
