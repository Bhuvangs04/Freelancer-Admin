import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "./api";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface AdminUser {
  username: string;
  email: string;
  role: "admin" | "super_admin";
  chat_id: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: AdminUser) => void;
  logout: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the admin session is still valid on mount
  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AdminUser;
        setAdmin(parsed);
      } catch {
        localStorage.removeItem("admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((data: AdminUser) => {
    setAdmin(data);
    localStorage.setItem("admin_user", JSON.stringify(data));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.get("/api/vi/logout");
    } catch {
      // Ignore errors during logout
    }
    setAdmin(null);
    localStorage.removeItem("admin_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
