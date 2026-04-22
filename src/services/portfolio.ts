/**
 * 🔌 PORTFOLIO SERVICE — Backend integration point
 *
 * Endpoints:
 *   GET    /api/portfolio       → Holding[]
 *   POST   /api/portfolio       → Holding
 *   PATCH  /api/portfolio/:id   → Holding
 *   DELETE /api/portfolio/:id   → 200
 *
 * Currently all data lives in PortfolioContext (localStorage).
 * To go live: import apiFetch and swap the context methods.
 */

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  sector?: string;
}

// 🔌 Placeholder — swap with real API calls
// import { apiFetch } from "@/lib/api";
// export const getPortfolio = () => apiFetch<Holding[]>("/api/portfolio");
// export const addHolding = (h: Omit<Holding, "id">) => apiFetch<Holding>("/api/portfolio", { method: "POST", body: h });
// export const updateHolding = (id: string, patch: Partial<Holding>) => apiFetch<Holding>(`/api/portfolio/${id}`, { method: "PATCH", body: patch });
// export const deleteHolding = (id: string) => apiFetch(`/api/portfolio/${id}`, { method: "DELETE" });
