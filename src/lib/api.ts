import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
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

const usersApiClient = axios.create({
  baseURL: '/api/users',
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
usersApiClient.interceptors.request.use(attachAuth);

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
usersApiClient.interceptors.response.use((r) => r, onUnauthorized);

// ── Auth endpoints ───────────────────────────────────────────────
export const authApi = {
  login: (req: LoginRequest) =>
    authApiClient.post<LoginResponse>('/login', req).then((r) => r.data),
  me: () => authApiClient.get<UserDto>('/me').then((r) => r.data),
  changePassword: (req: ChangePasswordRequest) =>
    authApiClient.post<UserDto>('/change-password', req).then((r) => r.data),
};

// ── User management endpoints (superuser only) ───────────────────
export const usersApi = {
  list: () => usersApiClient.get<UserDto[]>('').then((r) => r.data),
  get: (id: number) => usersApiClient.get<UserDto>(`/${id}`).then((r) => r.data),
  create: (req: CreateUserRequest) =>
    usersApiClient.post<UserDto>('', req).then((r) => r.data),
  update: (id: number, req: UpdateUserRequest) =>
    usersApiClient.put<UserDto>(`/${id}`, req).then((r) => r.data),
  remove: (id: number) =>
    usersApiClient.delete<void>(`/${id}`).then((r) => r.data),
};

