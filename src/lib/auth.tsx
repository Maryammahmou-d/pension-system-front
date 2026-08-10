import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { securityLevelForRole, tokenStorage, userStorage, usersApi } from './api';
import type { ChangePasswordRequest, LoginRequest, PermissionKey, UserDto } from '../types';

interface AuthState {
  user: UserDto | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<UserDto>;
  logout: () => void;
  changePassword: (req: ChangePasswordRequest) => Promise<UserDto>;
  refresh: () => Promise<void>;
  /** Returns true for superusers OR users with the given permission flag. */
  has: (perm: PermissionKey) => boolean;
  /** Access-style security level for settle window rules (1 Admin, 5 Tech). */
  securityLevel: () => number;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function migrateStoredUser(raw: UserDto | null): UserDto | null {
  if (!raw) return null;
  // Drop stale sessions missing Rubix permission / role fields.
  if (!('permCreateInvoice' in raw) || !('userSecurity' in raw)) {
    tokenStorage.clear();
    return null;
  }
  return raw;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => migrateStoredUser(userStorage.get()));
  const [loading, setLoading] = useState<boolean>(() => !!tokenStorage.get());

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) { setLoading(false); return; }
    const stored = migrateStoredUser(userStorage.get());
    if (stored) setUser(stored);
    else setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('kaf-rubix:unauthorized', handler);
    return () => window.removeEventListener('kaf-rubix:unauthorized', handler);
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    try {
      const u = await usersApi.authenticate(req.identifier, req.password);
      tokenStorage.set(`mock-rubix-token-${u.username}`);
      userStorage.set(u);
      setUser(u);
      return u;
    } catch (err) {
      throw Object.assign(
        new Error(
          err instanceof Error
            ? err.message
            : 'Invalid credentials.',
        ),
        { isAuthError: true },
      );
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (req: ChangePasswordRequest) => {
    const stored = userStorage.get();
    if (!stored) throw new Error('Not signed in.');
    const next = await usersApi.setPassword(
      stored.username,
      req.currentPassword,
      req.newPassword,
    );
    userStorage.set(next);
    setUser(next);
    return next;
  }, []);

  const refresh = useCallback(async () => {
    const stored = userStorage.get();
    if (!stored) return;
    try {
      const fresh = await usersApi.get(stored.id);
      userStorage.set(fresh);
      setUser(fresh);
    } catch {
      /* keep stored */
    }
  }, []);

  const has = useCallback((perm: PermissionKey) => {
    if (!user) return false;
    if (user.isSuperuser) return true;
    return Boolean(user[perm]);
  }, [user]);

  const securityLevel = useCallback(() => {
    if (!user) return 3;
    if (user.isSuperuser) return 1;
    return securityLevelForRole(user.userSecurity);
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, logout, changePassword, refresh, has, securityLevel }),
    [user, loading, login, logout, changePassword, refresh, has, securityLevel],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
