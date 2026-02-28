import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

// MOCK USER DATA for client-side demo login (when backend unavailable)
const MOCK_USERS = {
  admin: {
    user_id: 'demo_admin_001',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    picture: null,
    role: 'ADMIN',
    ruangan_rs: 'Admin Office',
    status_langganan: 'ACTIVE',
    berlaku_sampai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  user: {
    user_id: 'demo_user_001',
    email: 'user@demo.com',
    name: 'Demo User',
    picture: null,
    role: 'USER',
    ruangan_rs: 'Ruang Melati',
    status_langganan: 'TRIAL',
    berlaku_sampai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check localStorage for persisted demo session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('sepulangdinas_demo_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('sepulangdinas_demo_user');
      }
    }
    setLoading(false);
  }, []);

  const checkAuth = useCallback(async () => {
    // First check localStorage for demo user
    const storedUser = localStorage.getItem('sepulangdinas_demo_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('sepulangdinas_demo_user');
      }
    }

    // Then try API if available
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    // Clear localStorage demo user
    localStorage.removeItem('sepulangdinas_demo_user');
    
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      // Ignore API errors on logout
      console.error('Logout API failed:', err);
    }
    
    setUser(null);
    window.location.href = '/login';
  };

  // CLIENT-SIDE DEMO LOGIN - Works without backend!
  const demoLogin = async (email, password) => {
    // Determine user type from email
    const isAdmin = email === 'admin@demo.com';
    const mockUser = isAdmin ? MOCK_USERS.admin : MOCK_USERS.user;

    // Try backend first (if available)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(`${API_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Also save to localStorage as backup
        localStorage.setItem('sepulangdinas_demo_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.warn('Backend unavailable, using client-side demo login:', err.message);
    }

    // FALLBACK: Client-side mock authentication
    console.log('Using client-side demo authentication');
    
    // Save mock user to localStorage
    localStorage.setItem('sepulangdinas_demo_user', JSON.stringify(mockUser));
    
    // Update state
    setUser(mockUser);
    
    return mockUser;
  };

  const exchangeSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Session exchange failed');
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    // If demo user, update localStorage
    const storedUser = localStorage.getItem('sepulangdinas_demo_user');
    if (storedUser) {
      const updatedUser = { ...JSON.parse(storedUser), ...profileData };
      localStorage.setItem('sepulangdinas_demo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    demoLogin,
    exchangeSession,
    updateProfile,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
