# StockSense AI

Monorepo layout:

- **`frontend/`** — Vite + React app (`npm install` and `npm run dev` from this folder, or use root scripts below).
- **`supabase/`** — Edge Functions, migrations, and Supabase config (run Supabase CLI from the repo root).

From the **repo root**:

```bash
npm install --prefix frontend
npm run dev
```

See [`BACKEND.md`](BACKEND.md) for API integration details.
