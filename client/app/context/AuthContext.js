'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-read localStorage into state. Used on mount, and again whenever
  // something outside this context changes who's logged in.
  const syncFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        setUser(null);
        setToken(null);
      }
    } else {
      // Logged out elsewhere (e.g. a direct localStorage.removeItem) — the
      // context must not keep serving a stale, previously-logged-in user.
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    syncFromStorage();
    setLoading(false);

    // Safety net: some auth flows (login page, Google OAuth callback,
    // logout) write to localStorage directly instead of going through
    // login()/logout() below, and only dispatch 'authChange'/'storage'.
    // Without this, this context's token/user would silently go stale
    // for the rest of the tab's life after the first login — causing a
    // later login as a *different* user to keep using the first user's
    // token wherever a component prefers ctx.token over localStorage.
    window.addEventListener('authChange', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('authChange', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};