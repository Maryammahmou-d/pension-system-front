import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
  PermissionKey,
} from '../types';

// ── Token storage ────────────────────────────────────────────────
const TOKEN_KEY = 'kaf_rubix_token';
const USER_KEY = 'kaf_rubix_user';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get: (): UserDto | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserDto; } catch { return null; }
  },
  set: (user: UserDto) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

// ── Axios instances (shared interceptors) ────────────────────────
const authApiClient = axios.create({
  baseURL: '/api/auth',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token (if any) to every outgoing request.
const attachAuth = (cfg: import('axios').InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token && cfg.headers) {
    cfg.headers.set?.('Authorization', `Bearer ${token}`);
  }
  return cfg;
};
authApiClient.interceptors.request.use(attachAuth);

// On 401, surface a custom event so the AuthContext can sign the user out
// and redirect to /login. We don't redirect here directly to keep this
// module decoupled from React Router.
const onUnauthorized = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('kaf-rubix:unauthorized'));
  }
  return Promise.reject(error);
};
authApiClient.interceptors.response.use((r) => r, onUnauthorized);

// ── Auth endpoints ───────────────────────────────────────────────
export const authApi = {
  login: (req: LoginRequest) =>
    authApiClient.post<LoginResponse>('/login', req).then((r) => r.data),
  me: () => authApiClient.get<UserDto>('/me').then((r) => r.data),
  changePassword: (req: ChangePasswordRequest) =>
    authApiClient.post<UserDto>('/change-password', req).then((r) => r.data),
};

// ── In-memory mock user store (no backend required) ─────────────
const ALL_PERM_KEYS: PermissionKey[] = [
  'permViewDashboard', 'permViewAuditLog', 'permViewFlaggedRecords',
  'permRunAmlCheck', 'permRunBatchCheck', 'permViewLists',
  'permManageLists', 'permUploadLists',
];

const allPerms = (): Record<PermissionKey, boolean> =>
  Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, true])) as Record<PermissionKey, boolean>;

let _users: UserDto[] = [
  {
    id: 1, username: 'admin', email: 'admin@rubix.local', fullName: 'Administrator',
    isSuperuser: true, isActive: true, mustChangePassword: false, ...allPerms(),
  },
];
let _nextId = 2;
const delay = () => new Promise<void>((r) => setTimeout(r, 120));

export const usersApi = {
  list: async (): Promise<UserDto[]> => { await delay(); return [..._users]; },
  get: async (id: number): Promise<UserDto> => {
    await delay();
    const u = _users.find((x) => x.id === id);
    if (!u) throw new Error(`User ${id} not found`);
    return { ...u };
  },
  create: async (req: CreateUserRequest): Promise<UserDto> => {
    await delay();
    const u: UserDto = {
      id: _nextId++,
      username: req.username,
      email: req.email,
      fullName: req.fullName ?? null,
      isSuperuser: req.isSuperuser ?? false,
      isActive: true,
      mustChangePassword: true,
      ...Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, (req as unknown as Record<string, unknown>)[k] ?? false])) as Record<PermissionKey, boolean>,
    };
    _users = [..._users, u];
    return { ...u };
  },
  update: async (id: number, req: UpdateUserRequest): Promise<UserDto> => {
    await delay();
    _users = _users.map((u) => u.id === id ? { ...u, ...req } : u);
    const updated = _users.find((x) => x.id === id)!;
    return { ...updated };
  },
  remove: async (id: number): Promise<void> => {
    await delay();
    _users = _users.filter((u) => u.id !== id);
  },
};

