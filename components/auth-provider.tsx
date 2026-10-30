"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearAccessToken,
  getDemoUserFromToken,
  getAccessToken,
  getCurrentUser,
  hasPermission,
  isDemoMode,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
} from "@/lib/auth-client";
import { emitAppDataChange } from "@/lib/app-data-store";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setUser(getAccessToken() ? getDemoUserFromToken() : null);
      setLoading(false);
      return;
    }

    if (!getAccessToken()) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        clearAccessToken();
        toast.error(error instanceof Error ? error.message : "Unable to restore your session. Please sign in again.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string, remember = true) {
    const nextUser = await loginRequest(email, password, remember);
    setUser(nextUser);
    emitAppDataChange();
  }

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      toast.error(error instanceof Error ? `Signed out locally. Server logout failed: ${error.message}` : "Signed out locally, but server logout failed.");
    } finally {
      emitAppDataChange();
      router.replace("/");
      setUser(null);
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, logout, hasPermission: (permission: string) => hasPermission(user, permission) }),
    [user, loading, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
