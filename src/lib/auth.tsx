import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { tokenStorage, userStorage } from './api';
import type { ChangePasswordRequest, LoginRequest, PermissionKey, UserDto } from '../types';

const MOCK_USER: UserDto = {
  id: 1,
  username: 'admin',
  email: 'admin@rubix.local',
  fullName: 'Administrator',
  isSuperuser: true,
  isActive: true,
  mustChangePassword: false,
  permViewDashboard: true,
  permViewAuditLog: true,
  permViewFlaggedRecords: true,
  permRunAmlCheck: true,
  permRunBatchCheck: true,
  permViewLists: true,
  permManageLists: true,
  permUploadLists: true,
};

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

  // Restore session from localStorage on mount (mock — no backend call needed).
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) { setLoading(false); return; }
    const stored = userStorage.get();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  // Listen for the global "unauthorized" event triggered by the axios
  // 401 interceptor — clears in-memory user state.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('kaf-rubix:unauthorized', handler);
    return () => window.removeEventListener('kaf-rubix:unauthorized', handler);
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    if (req.identifier !== 'admin' || req.password !== 'admin') {
      throw Object.assign(new Error('Invalid credentials. Use admin / admin.'), { isAuthError: true });
    }
    tokenStorage.set('mock-rubix-token');
    userStorage.set(MOCK_USER);
    setUser(MOCK_USER);
    return MOCK_USER;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (_req: ChangePasswordRequest) => {
    const stored = userStorage.get() ?? MOCK_USER;
    userStorage.set(stored);
    setUser(stored);
    return stored;
  }, []);

  const refresh = useCallback(async () => {
    const stored = userStorage.get() ?? MOCK_USER;
    userStorage.set(stored);
    setUser(stored);
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
