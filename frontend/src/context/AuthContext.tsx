import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User as SbUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (patch: Partial<{ name: string; email: string; avatarUrl: string }>) => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  riskAppetite: "medium",
  preferredSectors: [],
  notificationsEnabled: true,
  theme: "light",
};

interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  risk_appetite: string;
  preferred_sectors: string[];
  notifications_enabled: boolean;
  theme: string;
}

const buildUser = (sb: SbUser, profile: ProfileRow | null): User => ({
  id: sb.id,
  name: profile?.name || (sb.email?.split("@")[0] ?? "User"),
  email: sb.email ?? "",
  avatarUrl: profile?.avatar_url ?? undefined,
  preferences: profile
    ? {
        riskAppetite: (profile.risk_appetite as RiskAppetite) ?? "medium",
        preferredSectors: profile.preferred_sectors ?? [],
        notificationsEnabled: profile.notifications_enabled,
        theme: (profile.theme as "light" | "dark") ?? "light",
      }
    : defaultPreferences,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (sb: SbUser): Promise<void> => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sb.id)
      .maybeSingle();
    setUser(buildUser(sb, data as ProfileRow | null));
  }, []);

  useEffect(() => {
    // Set up listener BEFORE getSession to avoid race conditions.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Defer DB call to avoid deadlocking the auth callback.
        setTimeout(() => loadProfile(sess.user), 0);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadProfile(sess.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signup = async (name: string, email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name },
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  };

  const updateProfile = async (patch: Partial<{ name: string; email: string; avatarUrl: string }>) => {
    if (!user) return;
    const dbPatch: { name?: string; avatar_url?: string } = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (Object.keys(dbPatch).length) {
      const { error } = await supabase.from("profiles").update(dbPatch).eq("id", user.id);
      if (error) throw new Error(error.message);
    }
    if (patch.email && patch.email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email: patch.email });
      if (error) throw new Error(error.message);
    }
    setUser({ ...user, ...patch, avatarUrl: patch.avatarUrl ?? user.avatarUrl });
  };

  const updatePreferences = async (patch: Partial<UserPreferences>) => {
    if (!user) return;
    const dbPatch: { risk_appetite?: string; preferred_sectors?: string[]; notifications_enabled?: boolean; theme?: string } = {};
    if (patch.riskAppetite) dbPatch.risk_appetite = patch.riskAppetite;
    if (patch.preferredSectors) dbPatch.preferred_sectors = patch.preferredSectors;
    if (patch.notificationsEnabled !== undefined) dbPatch.notifications_enabled = patch.notificationsEnabled;
    if (patch.theme) dbPatch.theme = patch.theme;
    if (Object.keys(dbPatch).length) {
      const { error } = await supabase.from("profiles").update(dbPatch).eq("id", user.id);
      if (error) throw new Error(error.message);
    }
    setUser({ ...user, preferences: { ...user.preferences, ...patch } });
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, signup, logout, resetPassword, updatePassword, updateProfile, updatePreferences }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      session: null,
      loading: false,
      login: async () => {},
      signup: async () => {},
      logout: async () => {},
      resetPassword: async () => {},
      updatePassword: async () => {},
      updateProfile: async () => {},
      updatePreferences: async () => {},
    } as AuthContextValue;
  }
  return ctx;
};
