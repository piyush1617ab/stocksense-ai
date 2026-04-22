import { useState, useEffect } from "react";
import { USE_MOCKS } from "@/lib/api";

/**
 * Hook that resolves `true` once the app's essential services are ready.
 *
 * 🔌 When you add a real backend, expand the checks here:
 *   - Verify API health: GET /api/health
 *   - Rehydrate auth session: GET /api/auth/me
 *   - Load feature flags, remote config, etc.
 *
 * For now (mock mode) it simulates a brief connection delay so the
 * loading screen is visible during development.
 */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (USE_MOCKS) {
        // Simulate backend handshake
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        // 🔌 Real boot sequence — add your checks here
        // try {
        //   await apiFetch("/api/health");
        // } catch {
        //   console.warn("Backend unreachable — falling back to offline mode");
        // }
      }
      if (!cancelled) setReady(true);
    }

    boot();
    return () => { cancelled = true; };
  }, []);

  return ready;
}
