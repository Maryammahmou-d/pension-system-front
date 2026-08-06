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
import { API_BASE_URL, http } from './httpClient';

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
  baseURL: `${API_BASE_URL}/auth`,
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

/** Numeric `UserSecurity` codes as stored in the backend `users` table. */
export const ROLE_BY_SECURITY_LEVEL: Record<number, UserSecurityRole> = {
  1: 'Admin',
  2: 'Investment',
  3: 'Operations',
  4: 'Actuarial',
  5: 'Tech',
  6: 'CRM',
};

const SECURITY_LEVEL_BY_ROLE = Object.fromEntries(
  Object.entries(ROLE_BY_SECURITY_LEVEL).map(([level, role]) => [role, Number(level)]),
) as Record<UserSecurityRole, number>;

export function securityLevelForRole(role: UserSecurityRole | undefined): number {
  if (!role) return 3;
  return SECURITY_LEVEL_BY_ROLE[role] ?? 3;
}

export function roleForSecurityLevel(level: number | null | undefined): UserSecurityRole {
  return ROLE_BY_SECURITY_LEVEL[Number(level)] ?? 'Actuarial';
}

/** Raw row shape returned by `GET {API_BASE_URL}/users`. */
export interface BackendUserRow {
  userId: number;
  userLogin: string;
  fullName: string | null;
  password?: string | null;
  userSecurity: number;
}

function mapBackendUser(row: BackendUserRow): UserDto {
  const role = roleForSecurityLevel(row.userSecurity);
  const { isSuperuser, perms } = permissionsForRole(role);
  const username = row.userLogin ?? '';
  return {
    id: row.userId,
    username,
    email: `${username.toLowerCase()}@rubix.local`,
    fullName: row.fullName ?? username,
    userSecurity: role,
    isSuperuser,
    isActive: true,
    mustChangePassword: false,
    ...perms,
  };
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

let _loadedFromBackend = false;

/** Pulls the backend user list once so mock-only flows (login) see real users. */
async function ensureUsersLoaded(): Promise<void> {
  if (_loadedFromBackend) return;
  try {
    await usersApi.list();
    _loadedFromBackend = true;
  } catch {
    // Backend unreachable — fall back to the local seed users.
  }
}

function findByLogin(identifier: string): UserDto | undefined {
  const key = identifier.trim().toLowerCase();
  return _users.find(
    (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key,
  );
}

export const usersApi = {
  list: async (): Promise<UserDto[]> => {
    const { data } = await http.get<BackendUserRow[]>('/users');
    const mapped = data.map(mapBackendUser);

    // Keep the local store in sync so login / edit flows see the same users.
    _users = mapped;
    _nextId = mapped.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    for (const row of data) {
      if (row.userLogin && row.password) {
        _passwords[row.userLogin.toLowerCase()] = row.password;
      }
    }

    return [...mapped];
  },

  get: async (id: number): Promise<UserDto> => {
    await delay();
    const u = _users.find((x) => x.id === id);
    if (!u) throw new Error(`User ${id} not found`);
    return { ...u };
  },

  create: async (req: CreateUserRequest): Promise<UserDto> => {
    const username = req.username.trim();
    if (!username) throw new Error('Login ID is required.');
    if (!req.fullName?.trim()) throw new Error('Full Name is required.');
    if (!req.userSecurity) throw new Error('User Security is required.');
    if (findByLogin(username)) throw new Error('Login ID already exists.');

    const password = req.password?.trim() || DEFAULT_USER_PASSWORD;

    const { data } = await http.post<BackendUserRow>('/users', {
      userLogin: username,
      fullName: req.fullName.trim(),
      password,
      userSecurity: securityLevelForRole(req.userSecurity),
    });

    const created = mapBackendUser(data);
    _users = [..._users, created];
    _nextId = Math.max(_nextId, created.id + 1);
    _passwords[created.username.toLowerCase()] = password;
    return { ...created };
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
    await ensureUsersLoaded();
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
