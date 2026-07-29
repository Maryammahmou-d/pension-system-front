import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, tokenStorage, userStorage } from './api';
import type { ChangePasswordRequest, LoginRequest, PermissionKey, UserDto } from '../types';

interface AuthState {
  user: UserDto | null;
  loading: boolean;          // true while the initial /me call is in flight
  login: (req: LoginRequest) => Promise<UserDto>;
  logout: () => void;
  changePassword: (req: ChangePasswordRequest) => Promise<UserDto>;
  refresh: () => Promise<void>;
  /** Returns true for superusers OR users with the given permission flag. */
  has: (perm: PermissionKey) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => userStorage.get());
  const [loading, setLoading] = useState<boolean>(() => !!tokenStorage.get());

  // Refresh /me on mount if we have a stale token to validate it and pick up
  // any permission changes since the last login.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    authApi.me()
      .then((u) => {
        if (cancelled) return;
        userStorage.set(u);
        setUser(u);
      })
      .catch(() => {
        // 401 handler in api.ts already cleared the token; just clear state.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Listen for the global "unauthorized" event triggered by the axios
  // 401 interceptor — clears in-memory user state.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('kaf-aml:unauthorized', handler);
    return () => window.removeEventListener('kaf-aml:unauthorized', handler);
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    const res = await authApi.login(req);
    tokenStorage.set(res.token);
    userStorage.set(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (req: ChangePasswordRequest) => {
    const updated = await authApi.changePassword(req);
    userStorage.set(updated);
    setUser(updated);
    return updated;
  }, []);

  const refresh = useCallback(async () => {
    const u = await authApi.me();
    userStorage.set(u);
    setUser(u);
  }, []);

  const has = useCallback((perm: PermissionKey) => {
    if (!user) return false;
    if (user.isSuperuser) return true;
    return Boolean(user[perm]);
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, logout, changePassword, refresh, has }),
    [user, loading, login, logout, changePassword, refresh, has],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
