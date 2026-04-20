# StockSense AI — Backend Integration Guide

The frontend is fully wired with TanStack Query + a centralized API client
(`src/lib/api.ts`). To go live, point `VITE_API_URL` at your backend, set
`VITE_USE_MOCKS=false`, and implement the endpoints below.

## Auth headers
All authenticated requests send: `Authorization: Bearer <token>` where the
token is read from `localStorage[VITE_AUTH_TOKEN_KEY]` (default key:
`stocksense_token`). On a 401 response, the client clears the token and
redirects to `/login`.

## Endpoints

### Auth
```
POST   /api/auth/login        body: { email, password }   → { token, user }
POST   /api/auth/signup       body: { name, email, password } → { token, user }
GET    /api/auth/me           → { user }
PATCH  /api/users/me          body: Partial<User>         → { user }
```

### Stocks
```
GET    /api/stocks/search?q=  → StockSummary[]
GET    /api/stocks/:symbol    → StockDetail
GET    /api/stocks/:symbol/history?range=1D|1W|1M|1Y|5Y → { date: string, close: number }[]
GET    /api/stocks/:symbol/news → NewsItem[]
GET    /api/recommendations   (auth) → StockSummary[]
```

### Watchlist (auth)
```
GET    /api/watchlist            → string[]   (symbols)
POST   /api/watchlist            body: { symbol } → 200
DELETE /api/watchlist/:symbol    → 200
```

### Portfolio (auth)
```
GET    /api/portfolio                  → Holding[]
POST   /api/portfolio                  body: NewHolding → Holding
PATCH  /api/portfolio/:id              body: Partial<Holding> → Holding
DELETE /api/portfolio/:id              → 200
```

### Chat
```
POST   /api/chat   body: { messages: ChatMessage[] }   → { reply: string }
```

### Learn
```
GET    /api/learn/lessons              → Lesson[]
POST   /api/learn/progress             body: { lessonId, completed } → 200
```

## Type contracts
See `src/types/api.ts` for full Zod schemas. They double as TypeScript types
and runtime validators.

## Switching from mocks → real backend
1. Set `VITE_USE_MOCKS=false` in `.env.local`.
2. Set `VITE_API_URL=https://your-backend.example.com`.
3. Restart `npm run dev`. The UI is unchanged; data now comes from your API.
