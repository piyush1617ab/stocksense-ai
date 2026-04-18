import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

/**
 * 🔌 BACKEND INTEGRATION POINT
 * Suggested endpoints:
 *   GET    /api/portfolio              → Holding[]
 *   POST   /api/portfolio              → add holding
 *   PATCH  /api/portfolio/:id          → update qty/avg price
 *   DELETE /api/portfolio/:id
 * For now, holdings are persisted in localStorage per user.
 */

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
  addHolding: (h: Omit<Holding, "id">) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  totals: { invested: number; current: number; pnl: number; pnlPercent: number };
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

const keyFor = (userId: string) => `stocksense_portfolio_${userId}`;

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    if (!user) {
      setHoldings([]);
      return;
    }
    try {
      const raw = localStorage.getItem(keyFor(user.id));
      setHoldings(raw ? JSON.parse(raw) : []);
    } catch {
      setHoldings([]);
    }
  }, [user]);

  const persist = (next: Holding[]) => {
    setHoldings(next);
    if (user) localStorage.setItem(keyFor(user.id), JSON.stringify(next));
  };

  const addHolding = (h: Omit<Holding, "id">) => {
    persist([...holdings, { ...h, id: crypto.randomUUID() }]);
  };

  const removeHolding = (id: string) => persist(holdings.filter((h) => h.id !== id));

  const updateHolding = (id: string, patch: Partial<Holding>) =>
    persist(holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)));

  const invested = holdings.reduce((s, h) => s + h.quantity * h.avgPrice, 0);
  const current = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const pnl = current - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

  return (
    <PortfolioContext.Provider
      value={{ holdings, addHolding, removeHolding, updateHolding, totals: { invested, current, pnl, pnlPercent } }}
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
