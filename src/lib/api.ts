/**
 * Centralized API client.
 *
 * - Reads VITE_API_URL and VITE_USE_MOCKS from env.
 * - Injects bearer token from localStorage on every request.
 * - On 401, clears token and redirects to /login.
 * - Returns parsed JSON or throws an `ApiError` you can catch in TanStack Query.
 */

const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY ?? "stocksense_token";
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "true") === "true";

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip auth header even if a token exists. */
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = opts;
  const token = !skipAuth ? getToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setToken(null);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    throw new ApiError("Unauthorized", 401);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    throw new ApiError(
      (data as { message?: string } | undefined)?.message ?? `Request failed: ${res.status}`,
      res.status,
      data,
    );
  }

  return data as T;
}

const safeJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
