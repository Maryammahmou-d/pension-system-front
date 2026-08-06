import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
  PermissionKey,
  UserSecurityRole,
} from '../types';
import { DEFAULT_USER_PASSWORD } from '../types';

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

const attachAuth = (cfg: import('axios').InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token && cfg.headers) {
    cfg.headers.set?.('Authorization', `Bearer ${token}`);
  }
  return cfg;
};
authApiClient.interceptors.request.use(attachAuth);

const onUnauthorized = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('kaf-rubix:unauthorized'));
  }
  return Promise.reject(error);
};
authApiClient.interceptors.response.use((r) => r, onUnauthorized);

export const authApi = {
  login: (req: LoginRequest) =>
    authApiClient.post<LoginResponse>('/login', req).then((r) => r.data),
  me: () => authApiClient.get<UserDto>('/me').then((r) => r.data),
  changePassword: (req: ChangePasswordRequest) =>
    authApiClient.post<UserDto>('/change-password', req).then((r) => r.data),
};

// ── In-memory mock user store ────────────────────────────────────
export const ALL_PERM_KEYS: PermissionKey[] = [
  'permViewDashboard',
  'permCreateInvoice',
  'permSettleInvoice',
  'permCancelInvoice',
  'permAddTopUp',
  'permBulkTopUp',
  'permManageUsers',
];

const nonePerms = (): Record<PermissionKey, boolean> =>
  Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, false])) as Record<PermissionKey, boolean>;

const allPerms = (): Record<PermissionKey, boolean> =>
  Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, true])) as Record<PermissionKey, boolean>;

export function permissionsForRole(role: UserSecurityRole): {
  isSuperuser: boolean;
  perms: Record<PermissionKey, boolean>;
} {
  const perms = nonePerms();
  perms.permViewDashboard = true;

  switch (role) {
    case 'Admin':
      return { isSuperuser: true, perms: allPerms() };
    case 'Operations':
      perms.permCreateInvoice = true;
      perms.permAddTopUp = true;
      perms.permBulkTopUp = true;
      return { isSuperuser: false, perms };
    case 'Investment':
    case 'CRM':
      perms.permSettleInvoice = true;
      return { isSuperuser: false, perms };
    case 'Tech':
      perms.permCreateInvoice = true;
      perms.permSettleInvoice = true;
      perms.permCancelInvoice = true;
      perms.permAddTopUp = true;
      perms.permBulkTopUp = true;
      return { isSuperuser: false, perms };
    case 'Actuarial':
      return { isSuperuser: false, perms };
    default:
      return { isSuperuser: false, perms };
  }
}

export function securityLevelForRole(role: UserSecurityRole | undefined): number {
  if (role === 'Admin') return 1;
  if (role === 'Tech') return 5;
  return 3;
}

let _users: UserDto[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@rubix.local',
    fullName: 'Administrator',
    userSecurity: 'Admin',
    isSuperuser: true,
    isActive: true,
    mustChangePassword: false,
    ...allPerms(),
  },
  {
    id: 2,
    username: 'ops',
    email: 'ops@rubix.local',
    fullName: 'Operations User',
    userSecurity: 'Operations',
    isSuperuser: false,
    isActive: true,
    mustChangePassword: false,
    ...permissionsForRole('Operations').perms,
  },
  {
    id: 3,
    username: 'crm',
    email: 'crm@rubix.local',
    fullName: 'CRM User',
    userSecurity: 'CRM',
    isSuperuser: false,
    isActive: true,
    mustChangePassword: false,
    ...permissionsForRole('CRM').perms,
  },
  {
    id: 4,
    username: 'tech',
    email: 'tech@rubix.local',
    fullName: 'Tech User',
    userSecurity: 'Tech',
    isSuperuser: false,
    isActive: true,
    mustChangePassword: false,
    ...permissionsForRole('Tech').perms,
  },
];

/** username (lowercase) → plaintext password (mock only) */
const _passwords: Record<string, string> = {
  admin: 'admin',
  ops: 'ops',
  crm: 'crm',
  tech: 'tech',
};

let _nextId = 5;
const delay = () => new Promise<void>((r) => setTimeout(r, 120));

function findByLogin(identifier: string): UserDto | undefined {
  const key = identifier.trim().toLowerCase();
  return _users.find(
    (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key,
  );
}

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
    const username = req.username.trim();
    if (!username) throw new Error('Login ID is required.');
    if (!req.fullName?.trim()) throw new Error('Full Name is required.');
    if (!req.userSecurity) throw new Error('User Security is required.');
    if (findByLogin(username)) throw new Error('Login ID already exists.');

    const { isSuperuser, perms } = permissionsForRole(req.userSecurity);
    const password = req.password ?? DEFAULT_USER_PASSWORD;
    const email = (req.email?.trim() || `${username}@rubix.local`).toLowerCase();

    const u: UserDto = {
      id: _nextId++,
      username,
      email,
      fullName: req.fullName.trim(),
      userSecurity: req.userSecurity,
      isSuperuser: req.isSuperuser ?? isSuperuser,
      isActive: true,
      mustChangePassword: true,
      ...perms,
    };

    _users = [..._users, u];
    _passwords[username.toLowerCase()] = password;
    return { ...u };
  },

  update: async (id: number, req: UpdateUserRequest): Promise<UserDto> => {
    await delay();
    const existing = _users.find((x) => x.id === id);
    if (!existing) throw new Error(`User ${id} not found`);

    let next: UserDto = { ...existing };

    if (req.fullName !== undefined) next.fullName = req.fullName;
    if (req.email !== undefined) next.email = req.email;
    if (req.isActive !== undefined) next.isActive = req.isActive;

    if (req.userSecurity !== undefined) {
      const mapped = permissionsForRole(req.userSecurity);
      next.userSecurity = req.userSecurity;
      next.isSuperuser = mapped.isSuperuser;
      next = { ...next, ...mapped.perms };
    }

    if (req.isSuperuser !== undefined) next.isSuperuser = req.isSuperuser;

    for (const k of ALL_PERM_KEYS) {
      if (req[k] !== undefined) next[k] = Boolean(req[k]);
    }

    if (req.resetPassword) {
      if (!req.newPassword || req.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters.');
      }
      _passwords[existing.username.toLowerCase()] = req.newPassword;
      next.mustChangePassword = true;
    }

    _users = _users.map((u) => (u.id === id ? next : u));
    return { ...next };
  },

  remove: async (id: number): Promise<void> => {
    await delay();
    const u = _users.find((x) => x.id === id);
    if (u) delete _passwords[u.username.toLowerCase()];
    _users = _users.filter((x) => x.id !== id);
  },

  authenticate: async (identifier: string, password: string): Promise<UserDto> => {
    await delay();
    const u = findByLogin(identifier);
    if (!u || !u.isActive) {
      throw Object.assign(new Error('Invalid credentials.'), { isAuthError: true });
    }
    const stored = _passwords[u.username.toLowerCase()];
    if (stored !== password) {
      throw Object.assign(new Error('Invalid credentials.'), { isAuthError: true });
    }
    return { ...u };
  },

  setPassword: async (
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserDto> => {
    await delay();
    const key = username.toLowerCase();
    const u = _users.find((x) => x.username.toLowerCase() === key);
    if (!u) throw new Error('User not found.');
    if (_passwords[key] !== currentPassword) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    _passwords[key] = newPassword;
    const next: UserDto = { ...u, mustChangePassword: false };
    _users = _users.map((x) => (x.id === u.id ? next : x));
    return { ...next };
  },
};

export {
  invoicesApi,
  topUpsApi,
  lookupsApi,
  unitPricesApi,
  netCompanyFundsApi,
  netCompanyFundsPaymentDateApi,
  netEmployeeFundsApi,
  netFundsApi,
  netUnitsApi,
  monthlyChargesApi,
  vestingRulesApi,
  employeeFundsWithdrawalApi,
  employeeTerminationApi,
  reportsApi,
  dateHelpers,
} from './rubixApi';
export type { ReportExtractFormat, ReportExtractResult } from './rubixApi';
