

# StockSense AI — Frontend Roadmap & Enhancement Plan

Since you're owning the frontend end-to-end and wiring backend yourself, this plan focuses on **what to add**, **how it fits the "learn about stocks you care about" core concept**, and **how to keep it backend-ready**.

---

## 1. Feature Suggestions (grouped by value)

### A. Personalized Learning (core concept)
1. **"Explain This Stock to Me" mode** — On Stock Detail, a beginner-mode toggle that rewrites every metric (P/E, RSI, MA, Beta) into plain-English cards with analogies.
2. **Learning Path per Stock** — When a user views RELIANCE, auto-suggest 3 lessons: "What is Oil & Gas sector?", "How to read P/E", "What moves Reliance's price?".
3. **Concept Glossary with hover tooltips** — Any financial term (EPS, Dividend Yield, Market Cap) anywhere in the app gets a dotted underline + hover card with definition.
4. **Daily Learning Streak** — Duolingo-style streak counter on profile, "Lesson of the Day" card on home.
5. **Quizzes after lessons** — 3-5 question quiz at end of each Learn module, score saved per user.
6. **"Ask AI about this"** button on every chart, news item, and metric — pre-fills the chatbot with context.

### B. Stock Discovery & Tracking
7. **Watchlist** — Star icon on every stock; dedicated `/watchlist` page.
8. **Stock Comparison** — Side-by-side compare up to 3 stocks (price, P/E, sector, 1Y return).
9. **Sector Explorer** — Browse stocks by sector (IT, Banking, Pharma) with a beginner intro to each sector.
10. **Personalized Home Feed** — "For You" section using the user's preferred sectors + risk appetite from Profile.

### C. Charts & Data Viz
11. **Interactive price chart** (Recharts) with 1D / 1W / 1M / 1Y / 5Y toggles.
12. **Annotated chart events** — Pin news headlines onto chart at the date they happened ("Why did it drop here?").
13. **Mini sparkline charts** on every StockCard.
14. **Portfolio allocation donut chart** — Sector/stock breakdown on Portfolio page.

### D. Engagement & Polish
15. **Notifications panel** — Bell icon in navbar, dropdown of price alerts, lesson reminders, news.
16. **Price Alerts UI** — "Notify me when RELIANCE drops below ₹2800".
17. **News filtering** — Filter by sector / sentiment / your watchlist.
18. **Empty states & onboarding tour** — First-time user walkthrough using a tour library.
19. **Command palette** (Cmd+K) — Quick jump to any stock, lesson, or page.
20. **Skeleton loaders everywhere + smooth route transitions**.

### E. Frontend Architecture (backend-ready)
21. **`src/lib/api.ts`** — Centralized fetch wrapper with `VITE_API_URL`, JWT bearer injection, 401 redirect.
22. **TanStack Query integration** — Replace direct fetches with `useQuery` / `useMutation` for caching, retries, loading states.
23. **Zod schemas** for all API contracts in `src/types/` — type-safe parsing of backend responses.
24. **MSW (Mock Service Worker)** — Intercepts API calls and returns dummy data so the UI works identically before/after backend wiring.
25. **Error boundary + global toast on API failures**.
26. **`.env.example`** documenting all `VITE_*` variables you'll need.

---

## 2. Recommended First Wave (what I'll build if you approve)

A focused, high-impact slice that strengthens the core "learn about stocks you like" concept:

| # | Feature | Why |
|---|---|---|
| 1 | **Watchlist** (star button + `/watchlist` page + localStorage) | Foundation for personalization |
| 2 | **Personalized Home** ("For You" section using preferences + watchlist) | Delivers on core promise |
| 3 | **"Explain This Stock" beginner panel** on Stock Detail | Core learning value |
| 4 | **Interactive Recharts price chart** with timeframe toggles | Expected fintech feature |
| 5 | **Glossary tooltips** for financial terms | Continuous learning |
| 6 | **Backend-ready API layer**: `src/lib/api.ts` + TanStack Query setup + `.env.example` + a sample `useStock(symbol)` hook | Makes your backend wiring trivial |
| 7 | **Polish**: command palette (Cmd+K), notifications bell stub, sparklines on StockCards | Modern feel |

---

## 3. Backend Integration Contract (so you know exactly what to build)

I'll document expected endpoints per feature in a single `BACKEND.md` file:

```text
GET  /api/stocks/:symbol           → StockDetail
GET  /api/stocks/:symbol/history   → { date, close }[]
GET  /api/stocks/:symbol/news      → NewsItem[]
GET  /api/stocks/search?q=         → StockSummary[]
GET  /api/recommendations          → StockSummary[]   (uses auth)
GET  /api/watchlist                → string[]         (symbols)
POST /api/watchlist     { symbol } → 200
DELETE /api/watchlist/:symbol      → 200
GET  /api/portfolio                → Holding[]
POST /api/portfolio                → Holding
PATCH/DELETE /api/portfolio/:id
GET  /api/auth/me                  → User
POST /api/auth/login               → { token, user }
POST /api/auth/signup              → { token, user }
POST /api/chat       { messages }  → { reply }   (SSE optional)
GET  /api/learn/lessons            → Lesson[]
POST /api/learn/progress           → 200
```

Every API call goes through `src/lib/api.ts` so swapping `VITE_USE_MOCKS=true → false` flips the whole app from dummy data to your real backend.

---

## 4. Technical Notes

- **TanStack Query** is already installed (`QueryClient` exists in `App.tsx`) but unused — we'll actually leverage it.
- **Recharts** to add for price charts (Tailwind-friendly, small bundle).
- **MSW** as a dev dependency — runs only in dev when `VITE_USE_MOCKS=true`, zero prod cost.
- **cmdk** package for the command palette (already a shadcn dependency via `command.tsx`).
- All new components live under `src/components/{watchlist,charts,learning,glossary}/`.
- All new hooks under `src/hooks/{useStock,useWatchlist,useChat}.ts`.
- No changes to your existing routes — only additions.

---

## 5. Out of Scope (for this wave)

Quizzes, streaks, price alerts, comparison, sector explorer, and notifications panel — all great next-wave features. Pick any from Section 1 after this lands.

---

**Approve this plan and I'll build Wave 1 in default mode.** If you want a different slice (e.g., "skip charts, do quizzes + streaks instead"), tell me which numbers from Section 1 to prioritize.

