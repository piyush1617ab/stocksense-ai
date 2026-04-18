import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * 🔌 BACKEND INTEGRATION POINT
 * Replace the dummy logic in this file with real API calls.
 * Suggested endpoints:
 *   POST /api/auth/login      → returns { user, token }
 *   POST /api/auth/signup     → returns { user, token }
 *   POST /api/auth/logout
 *   GET  /api/auth/me         → returns { user }   (called on app load)
 *   PATCH /api/users/me       → updates profile/preferences
 */

export type RiskAppetite = "low" | "medium" | "high";

export interface UserPreferences {
  riskAppetite: RiskAppetite;
  preferredSectors: string[];
  notificationsEnabled: boolean;
  theme: "light" | "dark";
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferences: UserPreferences;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "stocksense_user";

const defaultPreferences: UserPreferences = {
  riskAppetite: "medium",
  preferredSectors: ["Technology", "Banking"],
  notificationsEnabled: true,
  theme: "light",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔌 Replace with: GET /api/auth/me using stored token
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  // 🔌 Replace with: POST /api/auth/login
  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const fake: User = {
      id: "demo-user-1",
      name: email.split("@")[0],
      email,
      preferences: defaultPreferences,
    };
    persist(fake);
  };

  // 🔌 Replace with: POST /api/auth/signup
  const signup = async (name: string, email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const fake: User = {
      id: crypto.randomUUID(),
      name,
      email,
      preferences: defaultPreferences,
    };
    persist(fake);
  };

  // 🔌 Replace with: POST /api/auth/logout
  const logout = () => persist(null);

  // 🔌 Replace with: PATCH /api/users/me
  const updateProfile = (patch: Partial<User>) => {
    if (!user) return;
    persist({ ...user, ...patch });
  };

  const updatePreferences = (patch: Partial<UserPreferences>) => {
    if (!user) return;
    persist({ ...user, preferences: { ...user.preferences, ...patch } });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback no-op context so consumers don't crash if rendered outside provider
    return {
      user: null,
      loading: false,
      login: async () => {},
      signup: async () => {},
      logout: () => {},
      updateProfile: () => {},
      updatePreferences: () => {},
    } as AuthContextValue;
  }
  return ctx;
};
