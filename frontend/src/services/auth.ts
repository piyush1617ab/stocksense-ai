/**
 * 🔌 AUTH SERVICE — Backend integration point
 *
 * Endpoints:
 *   POST /api/auth/login    → { token, user }
 *   POST /api/auth/signup   → { token, user }
 *   GET  /api/auth/me       → { user }
 *   PATCH /api/users/me     → { user }
 *
 * Currently auth is handled by AuthContext with localStorage.
 * To go live:
 *   1. Import { apiFetch, setToken } from "@/lib/api"
 *   2. In AuthContext.login(), call loginApi() below and store the token
 *   3. In AuthContext useEffect, call getCurrentUser() to rehydrate on reload
 */

// import { apiFetch, setToken } from "@/lib/api";
// import type { User } from "@/context/AuthContext";

// export async function loginApi(email: string, password: string) {
//   const res = await apiFetch<{ token: string; user: User }>("/api/auth/login", {
//     method: "POST",
//     body: { email, password },
//     skipAuth: true,
//   });
//   setToken(res.token);
//   return res.user;
// }

// export async function signupApi(name: string, email: string, password: string) {
//   const res = await apiFetch<{ token: string; user: User }>("/api/auth/signup", {
//     method: "POST",
//     body: { name, email, password },
//     skipAuth: true,
//   });
//   setToken(res.token);
//   return res.user;
// }

// export async function getCurrentUser() {
//   return apiFetch<{ user: User }>("/api/auth/me");
// }

// export async function updateUser(patch: Record<string, unknown>) {
//   return apiFetch<{ user: User }>("/api/users/me", { method: "PATCH", body: patch });
// }
