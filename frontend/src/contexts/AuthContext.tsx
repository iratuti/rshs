'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'USER' | 'ADMIN';
  ruangan_rs?: string;
  status_langganan: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  berlaku_sampai?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  demoLogin: (email: string, password: string) => Promise<User>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for client-side demo (when API unavailable)
const MOCK_USERS: Record<string, User> = {
  admin: {
    user_id: 'demo_admin_001',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    role: 'ADMIN',
    ruangan_rs: 'Admin Office',
    status_langganan: 'ACTIVE',
    berlaku_sampai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  user: {
    user_id: 'demo_user_001',
    email: 'user@demo.com',
    name: 'Demo User',
    role: 'USER',
    ruangan_rs: 'Ruang Melati',
    status_langganan: 'TRIAL',
    berlaku_sampai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
};

const STORAGE_KEY = 'sepulangdinas_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(() => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.location.href = '/';
  }, []);

  const demoLogin = useCallback(async (email: string, password: string): Promise<User> => {
    const isAdmin = email === 'admin@demo.com';
    const mockUser = isAdmin ? MOCK_USERS.admin : MOCK_USERS.user;

    // Try API first with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
      }
    } catch {
      console.warn('API unavailable, using client-side auth');
    }

    // Fallback to client-side mock
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<User> => {
    if (!user) throw new Error('Not authenticated');
    
    const updatedUser = { ...user, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      demoLogin,
      updateProfile,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
