import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'blog-admin-token';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // must match functions/api/_middleware.js

function readTokenTimestamp(token) {
  try {
    // New format: base64url(payload).signature  — read payload before the dot.
    // Legacy format: base64(payload) with no dot — still decodes fine here.
    const head = token.split('.')[0];
    const b = head.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b.length % 4 ? '='.repeat(4 - (b.length % 4)) : '';
    const decoded = decodeURIComponent(escape(atob(b + pad)));
    const parts = decoded.split(':');
    if (parts.length < 3 || parts[0] !== 'admin') return null;
    const ts = Number(parts[1]);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

function loadValidToken() {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) return null;
  const ts = readTokenTimestamp(stored);
  if (ts === null || Date.now() - ts > TOKEN_TTL_MS) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return stored;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(loadValidToken);

  // Re-check on mount in case the tab sat idle past the TTL.
  useEffect(() => {
    if (!token) return;
    const ts = readTokenTimestamp(token);
    if (ts === null) return;
    const remaining = TOKEN_TTL_MS - (Date.now() - ts);
    if (remaining <= 0) {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    const timer = setTimeout(() => {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    }, remaining);
    return () => clearTimeout(timer);
  }, [token]);

  const login = useCallback(async (password) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem(TOKEN_KEY, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid password' };
    } catch {
      // Fallback for local dev: check against hardcoded hash
      // This will only work when API is unavailable
      return { success: false, error: 'Server unavailable' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  // Helper: detect 401-equivalent failures coming back from the API and
  // tear down the local session so the UI stops pretending we're logged in.
  const handleApiError = useCallback((err) => {
    const msg = String(err?.message || err || '');
    if (/token expired/i.test(msg) || /unauthorized/i.test(msg)) {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return true;
    }
    return false;
  }, []);

  const isAdmin = !!token;

  return (
    <AuthContext.Provider value={{ token, isAdmin, login, logout, handleApiError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
