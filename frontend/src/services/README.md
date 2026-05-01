# Services Layer — Backend Integration Points

Each file in this folder is a **service module** that abstracts one area of
backend communication. They all follow the same pattern:

1. Export async functions the UI calls.
2. If `USE_MOCKS` is `true`, return dummy data (no network).
3. If `USE_MOCKS` is `false`, call `apiFetch()` from `../lib/api.ts`.

## Files

| File | Domain | Key endpoints |
|------|--------|---------------|
| `chat.ts` | AI chatbot | `POST /api/chat` |
| `stocks.ts` | Stock data & search | `GET /api/stocks/:symbol`, `GET /api/stocks/search` |
| `auth.ts` | Authentication | `POST /api/auth/login`, `/signup`, `GET /api/auth/me` |
| `portfolio.ts` | Portfolio CRUD | `GET/POST/PATCH/DELETE /api/portfolio` |
| `watchlist.ts` | Watchlist CRUD | `GET/POST/DELETE /api/watchlist` |
| `learn.ts` | Lessons & progress | `GET /api/learn/lessons`, `POST /api/learn/progress` |

## How to connect your backend

1. In `frontend/`, set `VITE_USE_MOCKS=false` and `VITE_API_URL=https://your-api.com` in `.env.local`.
2. Implement the endpoints listed in `BACKEND.md`.
3. Each service file has `🔌` comments showing exactly where to swap mock → real logic.
4. Restart `npm run dev`. Done.

## Adding a new AI model / chatbot

See `chat.ts` — it exports both `sendMessage()` (request-response) and
`streamChat()` (SSE streaming). The streaming function is pre-wired for
OpenAI-compatible `/v1/chat/completions` format, which works with:
- OpenAI GPT
- Google Gemini (this app uses Gemini via the Supabase `chat` Edge Function and your API key)
- Anthropic Claude
- Any OpenAI-compatible proxy

Set `VITE_CHAT_URL` to your endpoint URL, or deploy an Edge Function and
it auto-discovers via `VITE_SUPABASE_URL`.
