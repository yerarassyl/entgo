import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { apiRequest } from "./api";

const TOKEN_KEY = "entgo-mobile-session";

type User = { id: string; name: string | null; email: string | null };
type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  targetScore: number;
  dailyMinutes: number;
  desiredUniversitySlug: string;
  examDate: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readToken() {
  if (Platform.OS === "web") return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveToken(token: string | null) {
  if (Platform.OS === "web") {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await readToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const profile = await apiRequest<User>("/api/mobile/me", {}, stored);
        setToken(stored);
        setUser(profile);
      } catch {
        await saveToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ token: string; user: User }>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await saveToken(result.token);
    setToken(result.token);
    setUser(result.user);
    router.replace("/(tabs)");
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await apiRequest<{ token: string; user: User }>("/api/mobile/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await saveToken(result.token);
    setToken(result.token);
    setUser(result.user);
    router.replace("/(tabs)");
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await apiRequest("/api/mobile/auth/logout", { method: "POST" }, token).catch(() => undefined);
    }
    await saveToken(null);
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [token]);

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
