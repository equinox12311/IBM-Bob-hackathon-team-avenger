// Shared auth state via React context — every component sees the same token.
// Security: Token encryption added (OWASP Phase 1)

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { decryptToken, encryptToken } from "@/lib/crypto";

const STORAGE_KEY = "cortex.diary_token";

interface AuthContextValue {
  token: string | null;
  login: (next: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;
    
    // Decrypt token from storage
    const decrypted = decryptToken(encrypted);
    if (!decrypted) {
      // If decryption fails, clear invalid token
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return decrypted;
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        // Decrypt token when storage changes
        const decrypted = e.newValue ? decryptToken(e.newValue) : null;
        setToken(decrypted);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = useCallback((next: string) => {
    try {
      // Encrypt token before storing
      const encrypted = encryptToken(next);
      localStorage.setItem(STORAGE_KEY, encrypted);
      setToken(next);
    } catch (e) {
      console.error("Failed to encrypt token:", e);
      throw new Error("Failed to save authentication token");
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, login, logout }),
    [token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
