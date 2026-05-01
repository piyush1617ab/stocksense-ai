/**
 * 🔌 WATCHLIST SERVICE — Backend integration point
 *
 * Endpoints:
 *   GET    /api/watchlist          → string[]
 *   POST   /api/watchlist          → 200
 *   DELETE /api/watchlist/:symbol  → 200
 *
 * Currently handled by useWatchlist hook with localStorage.
 * To go live: uncomment the functions below and call from the hook.
 */

// import { apiFetch } from "@/lib/api";

// export const getWatchlist = () => apiFetch<string[]>("/api/watchlist");
// export const addToWatchlist = (symbol: string) =>
//   apiFetch("/api/watchlist", { method: "POST", body: { symbol } });
// export const removeFromWatchlist = (symbol: string) =>
//   apiFetch(`/api/watchlist/${symbol}`, { method: "DELETE" });
