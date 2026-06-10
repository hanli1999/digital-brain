import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiFetch } from "@/config/api";

interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function getStoredAuth() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (token && userStr) {
    try { return { token, user: JSON.parse(userStr) as User }; }
    catch { /* corrupt data */ }
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<{ token: string | null; user: User | null }>(getStoredAuth);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiFetch(`/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "登录失败");
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await apiFetch(`/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "注册失败");
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
